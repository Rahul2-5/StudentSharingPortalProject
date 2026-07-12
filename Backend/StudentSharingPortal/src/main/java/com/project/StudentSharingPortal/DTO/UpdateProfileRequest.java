package com.project.StudentSharingPortal.DTO;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(description = "Editable profile fields. Email and role cannot be changed here.")
public class UpdateProfileRequest {

    @Schema(description = "Updated full name.", example = "Jane A. Doe")
    private String name;

    @Schema(description = "Updated college / institution.", example = "State University")
    private String college;

    @Schema(description = "Updated degree program.", example = "M.Tech Data Science")
    private String program;

    @Schema(description = "Updated current semester.", example = "2")
    private Integer semester;
}
