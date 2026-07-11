package com.project.StudentSharingPortal.DTO;

import lombok.Data;

@Data
public class UpdateProfileRequest {
    private String name;
    private String college;
    private String program;
    private Integer semester;
}
