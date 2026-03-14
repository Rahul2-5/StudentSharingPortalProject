package com.project.StudentSharingPortal.Repository;

import com.project.StudentSharingPortal.Entity.StudyMaterial;
import com.project.StudentSharingPortal.Entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StudyMaterialRepository extends JpaRepository<StudyMaterial, Long> {

    List<StudyMaterial> findByUploader(User uploader);

    @Query("SELECT s FROM StudyMaterial s WHERE s.status = 'APPROVED'")
    List<StudyMaterial> findAllApproved();

    List<StudyMaterial> findByStatusOrderByUploadedAtDesc(StudyMaterial.MaterialStatus status);

    @Query("SELECT s FROM StudyMaterial s WHERE s.status = 'APPROVED' AND " +
           "(:keyword IS NULL OR LOWER(s.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(s.subject) LIKE LOWER(CONCAT('%', :keyword, '%'))) AND " +
           "(:semester IS NULL OR s.semester = :semester) AND " +
           "(:materialType IS NULL OR s.materialType = :materialType) " +
           "ORDER BY s.uploadedAt DESC")
    List<StudyMaterial> searchMaterials(
            @Param("keyword") String keyword,
            @Param("semester") Integer semester,
            @Param("materialType") StudyMaterial.MaterialType materialType
    );
}
