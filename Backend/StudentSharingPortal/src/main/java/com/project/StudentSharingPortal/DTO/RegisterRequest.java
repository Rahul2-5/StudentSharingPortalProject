package com.project.StudentSharingPortal.DTO;

import lombok.Data;

@Data
public class RegisterRequest {
    private String name;
    private String email;
    private String password;
    private String college;
    private Integer semester;
}
