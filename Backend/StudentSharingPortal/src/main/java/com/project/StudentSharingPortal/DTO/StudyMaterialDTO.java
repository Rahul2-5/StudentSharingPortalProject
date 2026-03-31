package com.project.StudentSharingPortal.DTO;

import com.project.StudentSharingPortal.Entity.StudyMaterial;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudyMaterialDTO {
    private Long id;
    private String title;
    private String description;
    private String fileName;
    private String fileType;
    private Long fileSize;
    private StudyMaterial.Category category;
    private StudyMaterial.MaterialStatus status;
    private String subject;
    private Integer semester;
    private Integer downloadCount;
    private LocalDateTime uploadedAt;
    private String uploaderName;
    private Long uploaderId;
    private String uploaderCollege;
    private Double averageRating;
    private Integer ratingCount;
}
