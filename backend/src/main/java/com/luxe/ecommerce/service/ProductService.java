package com.luxe.ecommerce.service;

import com.luxe.ecommerce.dto.ProductDto;
import com.luxe.ecommerce.model.Product;
import com.luxe.ecommerce.model.ProductImage;
import com.luxe.ecommerce.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;

    @Transactional(readOnly = true)
    public Page<Product> getAllProducts(Pageable pageable) {
        return productRepository.findByActiveTrue(pageable)
                .map(this::prepareProductForResponse);
    }

    @Transactional(readOnly = true)
    public Page<Product> getByCategory(String category, Pageable pageable) {
        return productRepository.findByCategoryAndActiveTrue(category, pageable)
                .map(this::prepareProductForResponse);
    }

    @Transactional(readOnly = true)
    public Page<Product> searchProducts(String query, Pageable pageable) {
        return productRepository.searchProducts(query, pageable)
                .map(this::prepareProductForResponse);
    }

    @Transactional(readOnly = true)
    public Product getById(Long id) {
        return prepareProductForResponse(findProductEntity(id));
    }

    public List<String> getAllCategories() {
        return productRepository.findAllCategories();
    }

    @Transactional
    public Product createProduct(ProductDto dto) {
        Product product = mapToEntity(dto, new Product());
        return prepareProductForResponse(productRepository.save(product));
    }

    @Transactional
    public Product updateProduct(Long id, ProductDto dto) {
        Product product = findProductEntity(id);
        mapToEntity(dto, product);
        return prepareProductForResponse(productRepository.save(product));
    }

    @Transactional
    public boolean upsertBySku(ProductDto dto) {
        Product product = null;
        boolean created = true;

        if (dto.getSku() != null && !dto.getSku().isBlank()) {
            product = productRepository.findBySku(dto.getSku().trim()).orElse(null);
            created = product == null;
        }

        if (product == null) {
            product = new Product();
        }

        mapToEntity(dto, product);
        productRepository.save(product);
        return created;
    }

    @Transactional
    public void deleteProduct(Long id) {
        Product product = findProductEntity(id);
        product.setActive(false);
    }

    private Product findProductEntity(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found"));
    }

    private Product mapToEntity(ProductDto dto, Product product) {

        product.setName(dto.getName());
        product.setDescription(dto.getDescription());
        product.setPrice(dto.getPrice());
        product.setOriginalPrice(dto.getOriginalPrice());
        product.setStock(dto.getStock());
        product.setCategory(dto.getCategory());
        product.setBrand(dto.getBrand());
        product.setSku(dto.getSku() == null ? null : dto.getSku().trim());
        product.setMainImageUrl(dto.getMainImageUrl());
        product.setActive(dto.isActive());
        if (dto.getRating() != null) {
            product.setRating(dto.getRating());
        }
        if (dto.getReviewCount() != null) {
            product.setReviewCount(dto.getReviewCount());
        }

        if (dto.getImages() != null) {

            List<ProductImage> images = dto.getImages()
                    .stream()
                    .map(url -> url == null ? null : url.trim())
                    .filter(url -> url != null && !url.isBlank())
                    .map(url -> ProductImage.builder()
                            .imageUrl(url)
                            .product(product)
                            .build())
                    .collect(Collectors.toList());

            product.setImages(images);

            if ((product.getMainImageUrl() == null || product.getMainImageUrl().isBlank()) && !images.isEmpty()) {
                product.setMainImageUrl(images.get(0).getImageUrl());
            }
        }

        return product;
    }

    private Product prepareProductForResponse(Product product) {
        if (product.getImages() != null) {
            product.getImages().size();

            if ((product.getMainImageUrl() == null || product.getMainImageUrl().isBlank())
                    && !product.getImages().isEmpty()) {
                product.setMainImageUrl(product.getImages().get(0).getImageUrl());
            }
        }

        return product;
    }
}
