package com.project.StudentSharingPortal.DTO;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Authentication result containing the JWT and the caller's profile summary.")
public class AuthResponse {

    @Schema(description = "Signed JWT bearer token. Send it as 'Authorization: Bearer <token>'.",
            example = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJqYW5lLmRvZUBjb2xsZWdlLmVkdSJ9.sig")
    private String token;

    @Schema(description = "User's full name.", example = "Jane Doe")
    private String name;

    @Schema(description = "User's email.", example = "jane.doe@college.edu")
    private String email;

    @Schema(description = "Role granted to the user.", example = "STUDENT",
            allowableValues = {"STUDENT", "ADMIN"})
    private String role;

    @Schema(description = "Internal user id.", example = "42")
    private Long userId;

    @Schema(description = "College / institution name.", example = "State University")
    private String college;

    @Schema(description = "Degree program.", example = "B.Tech Computer Science")
    private String program;

    @Schema(description = "Current semester.", example = "4")
    private Integer semester;
}
