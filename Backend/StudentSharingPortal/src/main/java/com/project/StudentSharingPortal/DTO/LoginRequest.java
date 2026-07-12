package com.project.StudentSharingPortal.DTO;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(description = "Credentials for logging in and obtaining a JWT.")
public class LoginRequest {

    @Schema(description = "Registered email address.", example = "jane.doe@college.edu",
            requiredMode = Schema.RequiredMode.REQUIRED)
    private String email;

    @Schema(description = "Account password.", example = "S3curePass!",
            requiredMode = Schema.RequiredMode.REQUIRED)
    private String password;
}
