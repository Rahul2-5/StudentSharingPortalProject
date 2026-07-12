package com.project.StudentSharingPortal.DTO;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(description = "Payload for registering a new student account.")
public class RegisterRequest {

    @Schema(description = "Full name of the student.", example = "Jane Doe",
            requiredMode = Schema.RequiredMode.REQUIRED)
    private String name;

    @Schema(description = "Email address, used as the login identifier (must be unique).",
            example = "jane.doe@college.edu", requiredMode = Schema.RequiredMode.REQUIRED)
    private String email;

    @Schema(description = "Account password (stored BCrypt-hashed).", example = "S3curePass!",
            requiredMode = Schema.RequiredMode.REQUIRED)
    private String password;

    @Schema(description = "College / institution name.", example = "State University")
    private String college;

    @Schema(description = "Degree program of study.", example = "B.Tech Computer Science")
    private String program;

    @Schema(description = "Current semester (1-8).", example = "4")
    private Integer semester;
}
