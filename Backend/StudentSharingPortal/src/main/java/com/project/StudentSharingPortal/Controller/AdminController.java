package com.project.StudentSharingPortal.Controller;

import com.project.StudentSharingPortal.DTO.StudyMaterialDTO;
import com.project.StudentSharingPortal.Entity.StudyMaterial;
import com.project.StudentSharingPortal.Services.StudyMaterialService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/materials")
@CrossOrigin
@Tag(name = "Admin - Moderation",
        description = "Moderation queue and approval actions. All endpoints require ROLE_ADMIN.")
public class AdminController {

    @Autowired
    private StudyMaterialService studyMaterialService;

    @Operation(summary = "List pending materials",
            description = "Returns every material awaiting moderation (status = PENDING). Requires ROLE_ADMIN.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Materials awaiting review"),
            @ApiResponse(responseCode = "403", description = "Caller is not an admin", content = @Content)
    })
    @GetMapping("/pending")
    public ResponseEntity<List<StudyMaterialDTO>> getPendingMaterials() {
        return ResponseEntity.ok(studyMaterialService.getPendingMaterials());
    }

    @Operation(summary = "Set moderation status",
            description = "Approves or rejects a material by setting its status. Only APPROVED materials become "
                    + "publicly visible and summarizable. Requires ROLE_ADMIN.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Updated material",
                    content = @Content(schema = @Schema(implementation = StudyMaterialDTO.class))),
            @ApiResponse(responseCode = "403", description = "Caller is not an admin", content = @Content)
    })
    @PutMapping("/{id}/status")
    public ResponseEntity<StudyMaterialDTO> updateStatus(
            @Parameter(description = "Material id", example = "101") @PathVariable Long id,
            @Parameter(description = "New moderation status", example = "APPROVED", required = true)
            @RequestParam StudyMaterial.MaterialStatus status) {
        return ResponseEntity.ok(studyMaterialService.updateStatus(id, status));
    }
}
