package com.project.StudentSharingPortal.Services;

import com.project.StudentSharingPortal.DTO.StudyMaterialDTO;
import com.project.StudentSharingPortal.Entity.StudyMaterial;
import com.project.StudentSharingPortal.Entity.User;
import com.project.StudentSharingPortal.Repository.StudyMaterialRepository;
import com.project.StudentSharingPortal.Repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class AiSummaryService {

    @Autowired
    private StudyMaterialRepository studyMaterialRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TextExtractionService textExtractionService;

    @Autowired
    private GeminiSummaryService geminiSummaryService;

    @Autowired
    private StudyMaterialService studyMaterialService;

    @Value("${ai.summary.max-input-chars}")
    private int maxInputChars;

    public StudyMaterialDTO getOrGenerateSummary(Long materialId, String requesterEmail, boolean regenerate) {
        StudyMaterial material = studyMaterialRepository.findById(materialId)
                .orElseThrow(() -> new RuntimeException("Material not found"));

        if (material.getStatus() != StudyMaterial.MaterialStatus.APPROVED) {
            throw new RuntimeException("Material is not available for summarization");
        }

        if (material.getAiSummary() != null && !regenerate) {
            return studyMaterialService.toDTO(material);
        }

        if (regenerate) {
            requireOwnerOrAdmin(material, requesterEmail);
        }

        String extractedText = textExtractionService.extractText(material);
        String truncatedText = extractedText.length() > maxInputChars
                ? extractedText.substring(0, maxInputChars)
                : extractedText;

        String summary = geminiSummaryService.summarize(truncatedText);

        material.setAiSummary(summary);
        material.setAiSummaryGeneratedAt(LocalDateTime.now());
        StudyMaterial saved = studyMaterialRepository.save(material);

        return studyMaterialService.toDTO(saved);
    }

    private void requireOwnerOrAdmin(StudyMaterial material, String requesterEmail) {
        boolean isOwner = material.getUploader().getEmail().equals(requesterEmail);
        if (isOwner) {
            return;
        }
        User requester = userRepository.findByEmail(requesterEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (!"ADMIN".equals(requester.getRole())) {
            throw new RuntimeException("You are not authorized to regenerate this summary");
        }
    }
}
