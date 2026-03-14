package com.project.StudentSharingPortal.Entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "study_materials")
public class StudyMaterial {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(length = 1000)
    private String description;

    @Column(nullable = false)
    private String fileName;

    @Column(nullable = false)
    private String filePath;

    private String fileType;

    private Long fileSize;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MaterialType materialType;

    private String subject;

    private Integer semester;

    @Builder.Default
    private Integer downloadCount = 0;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "uploader_id", nullable = false)
    private User uploader;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private MaterialStatus status = MaterialStatus.PENDING;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime uploadedAt;

    public enum MaterialType {
        NOTES, ASSIGNMENT, PAST_PAPER, REFERENCE_BOOK, OTHER
    }

    public enum MaterialStatus {
        PENDING, APPROVED, REJECTED
    }
}
