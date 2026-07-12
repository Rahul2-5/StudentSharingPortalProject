package com.project.StudentSharingPortal.DTO;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "A user's profile as returned by the profile endpoints.")
public class UserProfileDTO {

    @Schema(description = "Internal user id.", example = "42")
    private Long id;

    @Schema(description = "Full name.", example = "Jane Doe")
    private String name;

    @Schema(description = "Email address (immutable).", example = "jane.doe@college.edu")
    private String email;

    @Schema(description = "College / institution.", example = "State University")
    private String college;

    @Schema(description = "Degree program.", example = "B.Tech Computer Science")
    private String program;

    @Schema(description = "Current semester.", example = "4")
    private Integer semester;

    @Schema(description = "Role.", example = "STUDENT", allowableValues = {"STUDENT", "ADMIN"})
    private String role;

    @Schema(description = "Account creation timestamp.", example = "2026-01-15T09:30:00")
    private LocalDateTime createdAt;
}
