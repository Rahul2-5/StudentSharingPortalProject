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
@Table(name = "document_ratings",
       uniqueConstraints = @UniqueConstraint(columnNames = {"material_id", "rater_id"}))
public class DocumentRating {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "material_id", nullable = false)
    private StudyMaterial material;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rater_id", nullable = false)
    private User rater;

    @Column(nullable = false)
    private Integer score; // 1 to 5

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime ratedAt;
}
