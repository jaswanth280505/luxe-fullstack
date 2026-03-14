package com.luxe.ecommerce.service;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ClerkIdentityService {

    @Value("${app.clerk.issuer:}")
    private String clerkIssuer;

    @Value("${app.clerk.jwks-url:}")
    private String clerkJwksUrl;

    @Value("${app.clerk.secret-key:}")
    private String clerkSecretKey;

    private volatile JwtDecoder jwtDecoder;

    public VerifiedClerkUser verify(String clerkToken) {
        if (clerkIssuer.isBlank() || clerkJwksUrl.isBlank() || clerkSecretKey.isBlank()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Clerk authentication is not configured");
        }

        Jwt jwt;
        try {
            jwt = getJwtDecoder().decode(clerkToken);
        } catch (JwtException ex) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid Clerk session token", ex);
        }

        ClerkUserResponse clerkUser = RestClient.builder()
                .baseUrl("https://api.clerk.com/v1")
                .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + clerkSecretKey)
                .build()
                .get()
                .uri("/users/{id}", jwt.getSubject())
                .retrieve()
                .body(ClerkUserResponse.class);

        if (clerkUser == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unable to load Clerk user profile");
        }

        String email = clerkUser.resolvePrimaryEmail();
        if (email == null || email.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Clerk account must have a primary email address");
        }

        return new VerifiedClerkUser(
                jwt.getSubject(),
                email,
                clerkUser.resolveFullName(email));
    }

    private JwtDecoder getJwtDecoder() {
        JwtDecoder cached = jwtDecoder;
        if (cached != null) {
            return cached;
        }

        synchronized (this) {
            if (jwtDecoder == null) {
                NimbusJwtDecoder decoder = NimbusJwtDecoder.withJwkSetUri(clerkJwksUrl).build();
                OAuth2TokenValidator<Jwt> validator = JwtValidators.createDefaultWithIssuer(clerkIssuer);
                decoder.setJwtValidator(validator);
                jwtDecoder = decoder;
            }
            return jwtDecoder;
        }
    }

    public record VerifiedClerkUser(String clerkUserId, String email, String fullName) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record ClerkUserResponse(
            String id,
            @JsonProperty("first_name") String firstName,
            @JsonProperty("last_name") String lastName,
            @JsonProperty("primary_email_address_id") String primaryEmailAddressId,
            @JsonProperty("email_addresses") List<ClerkEmailAddress> emailAddresses) {

        private String resolvePrimaryEmail() {
            if (emailAddresses == null || emailAddresses.isEmpty()) {
                return null;
            }

            if (primaryEmailAddressId != null && !primaryEmailAddressId.isBlank()) {
                for (ClerkEmailAddress emailAddress : emailAddresses) {
                    if (primaryEmailAddressId.equals(emailAddress.id())) {
                        return emailAddress.emailAddress();
                    }
                }
            }

            return emailAddresses.get(0).emailAddress();
        }

        private String resolveFullName(String fallbackEmail) {
            StringBuilder builder = new StringBuilder();
            if (firstName != null && !firstName.isBlank()) {
                builder.append(firstName.trim());
            }
            if (lastName != null && !lastName.isBlank()) {
                if (builder.length() > 0) {
                    builder.append(' ');
                }
                builder.append(lastName.trim());
            }
            if (builder.length() > 0) {
                return builder.toString();
            }

            int atIndex = fallbackEmail.indexOf('@');
            return atIndex > 0 ? fallbackEmail.substring(0, atIndex) : fallbackEmail;
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record ClerkEmailAddress(String id, @JsonProperty("email_address") String emailAddress) {
    }
}