package com.project.StudentSharingPortal.Config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    private static final String BEARER_SCHEME = "bearerAuth";

    @Bean
    public OpenAPI studentSharingPortalOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Student Sharing Portal API")
                        .description("REST API for the Student Sharing Portal: study-material uploads, "
                                + "search/download, ratings, AI summaries (Gemini), and admin moderation. "
                                + "Most endpoints require a JWT bearer token obtained from /api/auth/login.")
                        .version("v1")
                        .contact(new Contact().name("Student Sharing Portal")))
                // Apply the bearer scheme globally; public endpoints simply ignore it.
                .addSecurityItem(new SecurityRequirement().addList(BEARER_SCHEME))
                .components(new Components()
                        .addSecuritySchemes(BEARER_SCHEME, new SecurityScheme()
                                .name(BEARER_SCHEME)
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")
                                .description("Paste the JWT returned by /api/auth/login (no \"Bearer \" prefix).")));
    }
}
