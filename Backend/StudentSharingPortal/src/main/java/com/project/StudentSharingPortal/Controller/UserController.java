package com.project.StudentSharingPortal.Controller;

import com.project.StudentSharingPortal.DTO.UpdateProfileRequest;
import com.project.StudentSharingPortal.DTO.UserProfileDTO;
import com.project.StudentSharingPortal.Services.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/users")
@CrossOrigin
@Tag(name = "User Profile", description = "Read and update the authenticated user's own profile.")
public class UserController {

    @Autowired
    private UserService userService;

    @Operation(summary = "Get my profile",
            description = "Returns the profile of the currently authenticated user.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "The caller's profile",
                    content = @Content(schema = @Schema(implementation = UserProfileDTO.class))),
            @ApiResponse(responseCode = "401", description = "Missing or invalid JWT", content = @Content)
    })
    @GetMapping("/me")
    public ResponseEntity<UserProfileDTO> getProfile(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(userService.getProfile(userDetails.getUsername()));
    }

    @Operation(summary = "Update my profile",
            description = "Updates the authenticated user's name/college/program/semester. "
                    + "Email and role are immutable and ignored if supplied.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Updated profile",
                    content = @Content(schema = @Schema(implementation = UserProfileDTO.class))),
            @ApiResponse(responseCode = "400", description = "Invalid payload",
                    content = @Content(schema = @Schema(example = "{\"error\":\"User not found\"}")))
    })
    @PutMapping("/me")
    public ResponseEntity<?> updateProfile(
            @RequestBody UpdateProfileRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            UserProfileDTO dto = userService.updateProfile(userDetails.getUsername(), request);
            return ResponseEntity.ok(dto);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
