package com.luxe.ecommerce.service;

import com.luxe.ecommerce.dto.ProductDto;
import com.luxe.ecommerce.dto.ProductImportResult;
import lombok.RequiredArgsConstructor;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStreamReader;
import java.io.Reader;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductCsvImportService {

    private final ProductService productService;

    public ProductImportResult importProducts(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("CSV file is required");
        }

        ProductImportResult result = ProductImportResult.builder().build();

        try (Reader reader = new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8);
             CSVParser parser = CSVFormat.DEFAULT.builder()
                     .setHeader()
                     .setSkipHeaderRecord(true)
                     .setIgnoreHeaderCase(true)
                     .setTrim(true)
                     .build()
                     .parse(reader)) {

            for (CSVRecord record : parser) {
                result.setProcessed(result.getProcessed() + 1);

                try {
                    ProductDto dto = mapRecord(record);
                    boolean created = productService.upsertBySku(dto);

                    if (created) {
                        result.setCreated(result.getCreated() + 1);
                    } else {
                        result.setUpdated(result.getUpdated() + 1);
                    }
                } catch (Exception ex) {
                    result.setFailed(result.getFailed() + 1);
                    result.getErrors().add(new ProductImportResult.RowError(
                            (int) record.getRecordNumber() + 1,
                            getValue(record, "sku"),
                            ex.getMessage()));
                }
            }
        } catch (IOException ex) {
            throw new IllegalArgumentException("Failed to read CSV file", ex);
        }

        return result;
    }

    private ProductDto mapRecord(CSVRecord record) {
        ProductDto dto = new ProductDto();

        dto.setName(requiredValue(record, "name"));
        dto.setDescription(getValue(record, "description"));
        dto.setPrice(parseBigDecimal(requiredValue(record, "price"), "price"));
        dto.setOriginalPrice(parseOptionalBigDecimal(getValue(record, "originalPrice")));
        dto.setStock(parseInteger(requiredValue(record, "stock"), "stock"));
        dto.setCategory(getValue(record, "category"));
        dto.setBrand(getValue(record, "brand"));
        dto.setSku(getValue(record, "sku"));
        dto.setActive(parseBoolean(getValue(record, "active"), true));
        dto.setRating(parseOptionalDouble(getValue(record, "rating")));
        dto.setReviewCount(parseOptionalInteger(getValue(record, "reviewCount")));

        List<String> images = parseImages(getValue(record, "images"));
        String mainImageUrl = getValue(record, "mainImageUrl");

        if ((mainImageUrl == null || mainImageUrl.isBlank()) && !images.isEmpty()) {
            mainImageUrl = images.get(0);
        }

        dto.setMainImageUrl(mainImageUrl);
        dto.setImages(images);

        return dto;
    }

    private List<String> parseImages(String rawValue) {
        if (rawValue == null || rawValue.isBlank()) {
            return List.of();
        }

        return Arrays.stream(rawValue.split("\\|"))
                .map(String::trim)
                .filter(value -> !value.isBlank())
                .distinct()
                .collect(Collectors.toList());
    }

    private String requiredValue(CSVRecord record, String column) {
        String value = getValue(record, column);
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("Missing required column: " + column);
        }
        return value;
    }

    private String getValue(CSVRecord record, String column) {
        if (!record.isMapped(column)) {
            return null;
        }

        String value = record.get(column);
        return value == null ? null : value.trim();
    }

    private BigDecimal parseBigDecimal(String value, String fieldName) {
        try {
            return new BigDecimal(value);
        } catch (NumberFormatException ex) {
            throw new IllegalArgumentException("Invalid " + fieldName + ": " + value);
        }
    }

    private BigDecimal parseOptionalBigDecimal(String value) {
        return value == null || value.isBlank() ? null : parseBigDecimal(value, "originalPrice");
    }

    private Integer parseInteger(String value, String fieldName) {
        try {
            return Integer.valueOf(value);
        } catch (NumberFormatException ex) {
            throw new IllegalArgumentException("Invalid " + fieldName + ": " + value);
        }
    }

    private Integer parseOptionalInteger(String value) {
        return value == null || value.isBlank() ? null : parseInteger(value, "reviewCount");
    }

    private Double parseOptionalDouble(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        try {
            return Double.valueOf(value);
        } catch (NumberFormatException ex) {
            throw new IllegalArgumentException("Invalid rating: " + value);
        }
    }

    private boolean parseBoolean(String value, boolean defaultValue) {
        if (value == null || value.isBlank()) {
            return defaultValue;
        }

        String normalized = value.trim().toLowerCase(Locale.ROOT);
        if ("true".equals(normalized) || "1".equals(normalized) || "yes".equals(normalized)) {
            return true;
        }
        if ("false".equals(normalized) || "0".equals(normalized) || "no".equals(normalized)) {
            return false;
        }

        throw new IllegalArgumentException("Invalid active value: " + value);
    }
}
