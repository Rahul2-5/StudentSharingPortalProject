package com.project.StudentSharingPortal.Controller;

import com.project.StudentSharingPortal.DTO.StudyMaterialDTO;
import com.project.StudentSharingPortal.Entity.StudyMaterial;
import com.project.StudentSharingPortal.Services.StudyMaterialService;
import com.project.StudentSharingPortal.Services.UserService;
import com.project.StudentSharingPortal.DTO.UserProfileDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/materials")
@CrossOrigin
public class AdminController {

    @Autowired
    private StudyMaterialService studyMaterialService;

    @Autowired
    private UserService userService;

    @GetMapping("/users")
    public ResponseEntity<List<UserProfileDTO>> getUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @GetMapping("/pending")
    public ResponseEntity<List<StudyMaterialDTO>> getPendingMaterials() {
        return ResponseEntity.ok(studyMaterialService.getPendingMaterials());
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<StudyMaterialDTO> updateStatus(
            @PathVariable Long id,
            @RequestParam StudyMaterial.MaterialStatus status) {
        return ResponseEntity.ok(studyMaterialService.updateStatus(id, status));
    }
}
