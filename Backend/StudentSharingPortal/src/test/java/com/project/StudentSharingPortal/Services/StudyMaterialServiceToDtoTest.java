package com.project.StudentSharingPortal.Services;

import com.project.StudentSharingPortal.DTO.StudyMaterialDTO;
import com.project.StudentSharingPortal.Entity.StudyMaterial;
import com.project.StudentSharingPortal.Entity.User;
import com.project.StudentSharingPortal.Repository.DocumentRatingRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StudyMaterialServiceToDtoTest {

    @Mock
    private DocumentRatingRepository ratingRepository;

    @InjectMocks
    private StudyMaterialService studyMaterialService;

    @Test
    void toDtoMapsAiSummaryFields() {
        User uploader = User.builder()
                .id(1L)
                .name("Test User")
                .email("t@test.com")
                .college("Test College")
                .build();
        LocalDateTime generatedAt = LocalDateTime.of(2026, 7, 11, 10, 0);
        StudyMaterial material = StudyMaterial.builder()
                .id(5L)
                .title("Notes")
                .category(StudyMaterial.Category.PDF)
                .status(StudyMaterial.MaterialStatus.APPROVED)
                .uploader(uploader)
                .aiSummary("A short summary")
                .aiSummaryGeneratedAt(generatedAt)
                .build();

        when(ratingRepository.findAverageScoreByMaterial(material)).thenReturn(null);
        when(ratingRepository.countByMaterial(material)).thenReturn(0);

        StudyMaterialDTO dto = studyMaterialService.toDTO(material);

        assertEquals("A short summary", dto.getAiSummary());
        assertEquals(generatedAt, dto.getAiSummaryGeneratedAt());
    }
}
