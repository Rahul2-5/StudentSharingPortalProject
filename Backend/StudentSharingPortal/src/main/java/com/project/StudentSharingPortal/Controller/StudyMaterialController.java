package com.project.StudentSharingPortal.Controller;

import com.project.StudentSharingPortal.DTO.StudyMaterialDTO;
import com.project.StudentSharingPortal.Services.AiSummaryService;
import com.project.StudentSharingPortal.Services.StudyMaterialService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import io.swagger.v3.oas.annotations.tags.Tag;
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
@Tag(name = "Study Materials",
        description = "Upload, browse, download, rate and summarize study materials. "
                + "Listing, detail and download are public; everything else needs a JWT.")
public class StudyMaterialController {

    @Autowired
    private StudyMaterialService studyMaterialService;

    @Autowired
    private AiSummaryService aiSummaryService;

    @Operation(summary = "Upload a study material",
            description = "Uploads a document (multipart/form-data). The new material starts in PENDING "
                    + "status and becomes visible for summarization once an admin approves it.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Uploaded; returns the created material",
                    content = @Content(schema = @Schema(implementation = StudyMaterialDTO.class))),
            @ApiResponse(responseCode = "401", description = "Missing or invalid JWT", content = @Content)
    })
    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> upload(
            @Parameter(description = "The document file (PDF/PPT/etc.)", required = true)
            @RequestParam("file") MultipartFile file,
            @Parameter(description = "Display title", example = "Operating Systems - Unit 3 Notes", required = true)
            @RequestParam("title") String title,
            @Parameter(description = "Optional description", example = "Covers CPU scheduling and deadlocks.")
            @RequestParam(value = "description", required = false) String description,
            @Parameter(description = "Category, e.g. NOTES / ASSIGNMENT / PAPER", example = "NOTES", required = true)
            @RequestParam("category") String category,
            @Parameter(description = "Subject name", example = "Operating Systems")
            @RequestParam(value = "subject", required = false) String subject,
            @Parameter(description = "Target semester (1-8)", example = "4")
            @RequestParam(value = "semester", required = false) Integer semester,
            @AuthenticationPrincipal UserDetails userDetails) throws IOException {

        StudyMaterialDTO dto = studyMaterialService.upload(
                file, title, description, category, subject, semester, userDetails.getUsername());
        return ResponseEntity.ok(dto);
    }

    @Operation(summary = "List or search materials",
            description = "Returns all approved materials. If any of keyword/semester/category is supplied, "
                    + "results are filtered accordingly. Public — no authentication required.")
    @ApiResponse(responseCode = "200", description = "Matching materials")
    @SecurityRequirements // public
    @GetMapping
    public ResponseEntity<List<StudyMaterialDTO>> getAll(
            @Parameter(description = "Free-text keyword matched against title/description/subject", example = "deadlock")
            @RequestParam(required = false) String keyword,
            @Parameter(description = "Filter by semester", example = "4")
            @RequestParam(required = false) Integer semester,
            @Parameter(description = "Filter by category", example = "NOTES")
            @RequestParam(required = false) String category) {

        if (keyword != null || semester != null || category != null) {
            return ResponseEntity.ok(studyMaterialService.search(keyword, semester, category));
        }
        return ResponseEntity.ok(studyMaterialService.getAll());
    }

    @Operation(summary = "Get material details",
            description = "Returns a single material's metadata, rating aggregate and cached AI summary. Public.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Found",
                    content = @Content(schema = @Schema(implementation = StudyMaterialDTO.class))),
            @ApiResponse(responseCode = "404", description = "No material with that id", content = @Content)
    })
    @SecurityRequirements // public
    @GetMapping("/{id}")
    public ResponseEntity<?> getById(
            @Parameter(description = "Material id", example = "101") @PathVariable Long id) {
        try {
            return ResponseEntity.ok(studyMaterialService.getById(id));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @Operation(summary = "Download the file",
            description = "Streams the stored file as an attachment. Increments the download counter. Public.")
    @ApiResponse(responseCode = "200", description = "Binary file stream",
            content = @Content(mediaType = MediaType.APPLICATION_OCTET_STREAM_VALUE))
    @SecurityRequirements // public
    @GetMapping("/download/{id}")
    public ResponseEntity<Resource> download(
            @Parameter(description = "Material id", example = "101") @PathVariable Long id)
            throws MalformedURLException {
        Resource resource = studyMaterialService.download(id);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + resource.getFilename() + "\"")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(resource);
    }

    @Operation(summary = "Delete a material",
            description = "Deletes a material and its stored file. Only the uploader (or an admin) may delete it.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Deleted"),
            @ApiResponse(responseCode = "400", description = "Not found or caller is not the owner",
                    content = @Content(schema = @Schema(example = "{\"error\":\"You can only delete your own uploads\"}")))
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(
            @Parameter(description = "Material id", example = "101") @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            studyMaterialService.delete(id, userDetails.getUsername());
            return ResponseEntity.ok(Map.of("message", "Material deleted successfully"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @Operation(summary = "List my uploads",
            description = "Returns every material uploaded by the authenticated user, in any status.")
    @ApiResponse(responseCode = "200", description = "The caller's uploads")
    @GetMapping("/my")
    public ResponseEntity<List<StudyMaterialDTO>> getMyUploads(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(studyMaterialService.getMyUploads(userDetails.getUsername()));
    }

    @Operation(summary = "Rate a material",
            description = "Records the caller's 1-5 rating (upserts an existing rating). "
                    + "You cannot rate your own upload.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Rating saved; returns the updated material",
                    content = @Content(schema = @Schema(implementation = StudyMaterialDTO.class))),
            @ApiResponse(responseCode = "400", description = "Score out of range 1-5, self-rating, or not found",
                    content = @Content(schema = @Schema(example = "{\"error\":\"Rating score must be between 1 and 5\"}")))
    })
    @PostMapping("/{id}/rate")
    public ResponseEntity<?> rateMaterial(
            @Parameter(description = "Material id", example = "101") @PathVariable Long id,
            @Parameter(description = "Rating score from 1 to 5", example = "5", required = true)
            @RequestParam("score") int score,
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            StudyMaterialDTO dto = studyMaterialService.rateMaterial(id, userDetails.getUsername(), score);
            return ResponseEntity.ok(dto);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @Operation(summary = "Get or generate an AI summary",
            description = "Returns the cached Gemini summary for an APPROVED material, generating it on first "
                    + "request. Pass regenerate=true to force a fresh summary — only the uploader or an admin may "
                    + "do that.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Material with its aiSummary populated",
                    content = @Content(schema = @Schema(implementation = StudyMaterialDTO.class))),
            @ApiResponse(responseCode = "400",
                    description = "Not found, not APPROVED, or not authorized to regenerate",
                    content = @Content(schema = @Schema(example = "{\"error\":\"Only approved materials can be summarized\"}")))
    })
    @PostMapping("/{id}/summarize")
    public ResponseEntity<?> summarize(
            @Parameter(description = "Material id", example = "101") @PathVariable Long id,
            @Parameter(description = "Force regeneration instead of returning the cached summary", example = "false")
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
