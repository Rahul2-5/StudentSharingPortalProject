package com.project.StudentSharingPortal.Controller;

import com.project.StudentSharingPortal.DTO.StudyMaterialDTO;
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

    /** Upload a new study material (requires auth) */
    @PostMapping("/upload")
    public ResponseEntity<?> upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam("title") String title,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam("materialType") String materialType,
            @RequestParam(value = "subject", required = false) String subject,
            @RequestParam(value = "semester", required = false) Integer semester,
            @AuthenticationPrincipal UserDetails userDetails) throws IOException {

        StudyMaterialDTO dto = studyMaterialService.upload(
                file, title, description, materialType, subject, semester, userDetails.getUsername());
        return ResponseEntity.ok(dto);
    }

    /** Get all materials or search with filters (public) */
    @GetMapping
    public ResponseEntity<List<StudyMaterialDTO>> getAll(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Integer semester,
            @RequestParam(required = false) String materialType) {

        if (keyword != null || semester != null || materialType != null) {
            return ResponseEntity.ok(studyMaterialService.search(keyword, semester, materialType));
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
}
