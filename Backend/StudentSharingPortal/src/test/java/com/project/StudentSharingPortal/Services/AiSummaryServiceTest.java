package com.project.StudentSharingPortal.Services;

import com.project.StudentSharingPortal.DTO.StudyMaterialDTO;
import com.project.StudentSharingPortal.Entity.StudyMaterial;
import com.project.StudentSharingPortal.Entity.User;
import com.project.StudentSharingPortal.Repository.StudyMaterialRepository;
import com.project.StudentSharingPortal.Repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AiSummaryServiceTest {

    @Mock private StudyMaterialRepository studyMaterialRepository;
    @Mock private UserRepository userRepository;
    @Mock private TextExtractionService textExtractionService;
    @Mock private GeminiSummaryService geminiSummaryService;
    @Mock private StudyMaterialService studyMaterialService;

    @InjectMocks
    private AiSummaryService aiSummaryService;

    private User uploader;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(aiSummaryService, "maxInputChars", 15000);
        uploader = User.builder().id(1L).email("uploader@test.com").role("STUDENT").build();
    }

    private StudyMaterial approvedMaterial(String cachedSummary) {
        return StudyMaterial.builder()
                .id(10L)
                .status(StudyMaterial.MaterialStatus.APPROVED)
                .category(StudyMaterial.Category.PDF)
                .filePath("/tmp/does-not-matter.pdf")
                .uploader(uploader)
                .aiSummary(cachedSummary)
                .build();
    }

    @Test
    void returnsCachedSummaryWithoutCallingExtractionOrGemini() {
        StudyMaterial material = approvedMaterial("already summarized");
        when(studyMaterialRepository.findById(10L)).thenReturn(Optional.of(material));
        when(studyMaterialService.toDTO(material)).thenReturn(new StudyMaterialDTO());

        aiSummaryService.getOrGenerateSummary(10L, "uploader@test.com", false);

        verify(textExtractionService, never()).extractText(any());
        verify(geminiSummaryService, never()).summarize(anyString());
        verify(studyMaterialRepository, never()).save(any());
    }

    @Test
    void throwsWhenMaterialIsNotApproved() {
        StudyMaterial material = approvedMaterial(null);
        material.setStatus(StudyMaterial.MaterialStatus.PENDING);
        when(studyMaterialRepository.findById(10L)).thenReturn(Optional.of(material));

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> aiSummaryService.getOrGenerateSummary(10L, "uploader@test.com", false));

        assertEquals("Material is not available for summarization", ex.getMessage());
    }

    @Test
    void generatesAndSavesSummaryWhenNoneCached() {
        StudyMaterial material = approvedMaterial(null);
        when(studyMaterialRepository.findById(10L)).thenReturn(Optional.of(material));
        when(textExtractionService.extractText(material)).thenReturn("extracted text");
        when(geminiSummaryService.summarize("extracted text")).thenReturn("a summary");
        when(studyMaterialRepository.save(material)).thenReturn(material);
        when(studyMaterialService.toDTO(material)).thenReturn(new StudyMaterialDTO());

        aiSummaryService.getOrGenerateSummary(10L, "uploader@test.com", false);

        assertEquals("a summary", material.getAiSummary());
        verify(studyMaterialRepository, times(1)).save(material);
    }

    @Test
    void regenerateByNonOwnerNonAdminThrows() {
        StudyMaterial material = approvedMaterial("old summary");
        when(studyMaterialRepository.findById(10L)).thenReturn(Optional.of(material));
        when(userRepository.findByEmail("stranger@test.com"))
                .thenReturn(Optional.of(User.builder().email("stranger@test.com").role("STUDENT").build()));

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> aiSummaryService.getOrGenerateSummary(10L, "stranger@test.com", true));

        assertEquals("You are not authorized to regenerate this summary", ex.getMessage());
        verify(textExtractionService, never()).extractText(any());
    }

    @Test
    void regenerateByAdminSucceedsEvenIfNotOwner() {
        StudyMaterial material = approvedMaterial("old summary");
        when(studyMaterialRepository.findById(10L)).thenReturn(Optional.of(material));
        when(userRepository.findByEmail("admin@test.com"))
                .thenReturn(Optional.of(User.builder().email("admin@test.com").role("ADMIN").build()));
        when(textExtractionService.extractText(material)).thenReturn("extracted text");
        when(geminiSummaryService.summarize("extracted text")).thenReturn("new summary");
        when(studyMaterialRepository.save(material)).thenReturn(material);
        when(studyMaterialService.toDTO(material)).thenReturn(new StudyMaterialDTO());

        aiSummaryService.getOrGenerateSummary(10L, "admin@test.com", true);

        assertEquals("new summary", material.getAiSummary());
    }

    @Test
    void truncatesExtractedTextBeforeSummarizing() {
        ReflectionTestUtils.setField(aiSummaryService, "maxInputChars", 10);
        StudyMaterial material = approvedMaterial(null);
        String longText = "0123456789ABCDEF";
        when(studyMaterialRepository.findById(10L)).thenReturn(Optional.of(material));
        when(textExtractionService.extractText(material)).thenReturn(longText);
        when(geminiSummaryService.summarize("0123456789")).thenReturn("summary");
        when(studyMaterialRepository.save(material)).thenReturn(material);
        when(studyMaterialService.toDTO(material)).thenReturn(new StudyMaterialDTO());

        aiSummaryService.getOrGenerateSummary(10L, "uploader@test.com", false);

        verify(geminiSummaryService).summarize("0123456789");
    }
}
