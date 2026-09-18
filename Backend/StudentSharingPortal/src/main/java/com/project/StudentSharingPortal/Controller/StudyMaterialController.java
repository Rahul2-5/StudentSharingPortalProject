package com.project.StudentSharingPortal.Controller;

import com.project.StudentSharingPortal.DTO.StudyMaterialDTO;
import com.project.StudentSharingPortal.Services.AiSummaryService;
import com.project.StudentSharingPortal.Services.StudyMaterialService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/materials")
@CrossOrigin
public class StudyMaterialController {

    @Autowired
    private StudyMaterialService studyMaterialService;

    @Autowired
    private AiSummaryService aiSummaryService;

    /** Upload a new study material (requires auth) */
    @PostMapping("/upload")
    public ResponseEntity<?> upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam("title") String title,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam("category") String category,
            @RequestParam(value = "subject", required = false) String subject,
            @RequestParam(value = "semester", required = false) Integer semester,
            @AuthenticationPrincipal UserDetails userDetails) throws IOException {

        StudyMaterialDTO dto = studyMaterialService.upload(
                file, title, description, category, subject, semester, userDetails.getUsername());
        return ResponseEntity.ok(dto);
    }

    /** Get all materials or search with filters (public) */
    @GetMapping
    public ResponseEntity<List<StudyMaterialDTO>> getAll(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Integer semester,
            @RequestParam(required = false) String category) {

        if (keyword != null || semester != null || category != null) {
            return ResponseEntity.ok(studyMaterialService.search(keyword, semester, category));
        }
        return ResponseEntity.ok(studyMaterialService.getAll());
    }

    /** Get single material details (public) */
    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(studyMaterialService.getById(id));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /** Download file (public) */
    @GetMapping("/download/{id}")
    public ResponseEntity<Resource> download(@PathVariable Long id) throws MalformedURLException {
        Resource resource = studyMaterialService.download(id);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + resource.getFilename() + "\"")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(resource);
    }

    /** Stream file inline for preview (public). Does NOT count as a download. */
    @GetMapping("/preview/{id}")
    public ResponseEntity<Resource> preview(@PathVariable Long id) throws MalformedURLException {
        Resource resource = studyMaterialService.preview(id);
        String contentType = studyMaterialService.getContentType(id);
        if (contentType == null || contentType.isBlank()) {
            contentType = MediaType.APPLICATION_OCTET_STREAM_VALUE;
        }
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "inline; filename=\"" + resource.getFilename() + "\"")
                .contentType(MediaType.parseMediaType(contentType))
                .body(resource);
    }

    /** Delete a material (auth + ownership) */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id,
                                    @AuthenticationPrincipal UserDetails userDetails) {
        try {
            studyMaterialService.delete(id, userDetails.getUsername());
            return ResponseEntity.ok(Map.of("message", "Material deleted successfully"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /** Get current user's uploads (requires auth) */
    @GetMapping("/my")
    public ResponseEntity<List<StudyMaterialDTO>> getMyUploads(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(studyMaterialService.getMyUploads(userDetails.getUsername()));
    }

    /** Rate a document (requires auth) */
    @PostMapping("/{id}/rate")
    public ResponseEntity<?> rateMaterial(
            @PathVariable Long id,
            @RequestParam("score") int score,
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            StudyMaterialDTO dto = studyMaterialService.rateMaterial(id, userDetails.getUsername(), score);
            return ResponseEntity.ok(dto);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /** Get or generate an AI summary for an approved material (requires auth) */
    @PostMapping("/{id}/summarize")
    public ResponseEntity<?> summarize(
            @PathVariable Long id,
            @RequestParam(value = "regenerate", defaultValue = "false") boolean regenerate,
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            StudyMaterialDTO dto = aiSummaryService.getOrGenerateSummary(id, userDetails.getUsername(), regenerate);
            return ResponseEntity.ok(dto);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
