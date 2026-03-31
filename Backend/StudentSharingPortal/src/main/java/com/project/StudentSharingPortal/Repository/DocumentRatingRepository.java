package com.project.StudentSharingPortal.Repository;

import com.project.StudentSharingPortal.Entity.DocumentRating;
import com.project.StudentSharingPortal.Entity.StudyMaterial;
import com.project.StudentSharingPortal.Entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DocumentRatingRepository extends JpaRepository<DocumentRating, Long> {

    Optional<DocumentRating> findByMaterialAndRater(StudyMaterial material, User rater);

    @Query("SELECT AVG(r.score) FROM DocumentRating r WHERE r.material = :material")
    Double findAverageScoreByMaterial(@Param("material") StudyMaterial material);

    @Query("SELECT COUNT(r) FROM DocumentRating r WHERE r.material = :material")
    Integer countByMaterial(@Param("material") StudyMaterial material);
}
