package com.project.StudentSharingPortal.DTO;

import com.project.StudentSharingPortal.Entity.StudyMaterial;
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
@Schema(description = "A study material with its metadata, moderation status, rating aggregate and AI summary.")
public class StudyMaterialDTO {

    @Schema(description = "Material id.", example = "101")
    private Long id;

    @Schema(description = "Title of the material.", example = "Operating Systems - Unit 3 Notes")
    private String title;

    @Schema(description = "Free-text description.", example = "Covers CPU scheduling and deadlocks.")
    private String description;

    @Schema(description = "Stored file name.", example = "os-unit3.pdf")
    private String fileName;

    @Schema(description = "MIME type of the file.", example = "application/pdf")
    private String fileType;

    @Schema(description = "File size in bytes.", example = "482301")
    private Long fileSize;

    @Schema(description = "Material category.", example = "NOTES")
    private StudyMaterial.Category category;

    @Schema(description = "Moderation status. Only APPROVED materials can be summarized.",
            example = "APPROVED")
    private StudyMaterial.MaterialStatus status;

    @Schema(description = "Subject the material belongs to.", example = "Operating Systems")
    private String subject;

    @Schema(description = "Target semester.", example = "4")
    private Integer semester;

    @Schema(description = "Number of times the file has been downloaded.", example = "37")
    private Integer downloadCount;

    @Schema(description = "Upload timestamp.", example = "2026-03-01T14:05:00")
    private LocalDateTime uploadedAt;

    @Schema(description = "Uploader's display name.", example = "Jane Doe")
    private String uploaderName;

    @Schema(description = "Uploader's user id.", example = "42")
    private Long uploaderId;

    @Schema(description = "Uploader's college.", example = "State University")
    private String uploaderCollege;

    @Schema(description = "Average rating across all raters (1-5), or null if unrated.", example = "4.5")
    private Double averageRating;

    @Schema(description = "Number of ratings received.", example = "8")
    private Integer ratingCount;

    @Schema(description = "Cached AI-generated summary, or null if not yet generated.",
            example = "This document explains CPU scheduling algorithms...")
    private String aiSummary;

    @Schema(description = "When the AI summary was generated.", example = "2026-03-02T10:00:00")
    private LocalDateTime aiSummaryGeneratedAt;
}
