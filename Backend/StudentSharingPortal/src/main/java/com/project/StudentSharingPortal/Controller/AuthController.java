package com.project.StudentSharingPortal.Controller;

import com.project.StudentSharingPortal.DTO.AuthResponse;
import com.project.StudentSharingPortal.DTO.LoginRequest;
import com.project.StudentSharingPortal.DTO.RegisterRequest;
import com.project.StudentSharingPortal.Services.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin
@Tag(name = "Authentication", description = "Register and log in. Both endpoints are public and return a JWT.")
@SecurityRequirements // public controller — no bearer token required
public class AuthController {

    @Autowired
    private AuthService authService;

    @Operation(summary = "Register a new student",
            description = "Creates a STUDENT account and returns a JWT plus the profile summary. "
                    + "Fails if the email is already registered.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Account created; JWT returned",
                    content = @Content(schema = @Schema(implementation = AuthResponse.class))),
            @ApiResponse(responseCode = "400", description = "Email already in use or invalid payload",
                    content = @Content(schema = @Schema(example = "{\"error\":\"Email already registered\"}")))
    })
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        try {
            AuthResponse response = authService.register(request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @Operation(summary = "Log in",
            description = "Validates credentials and returns a JWT to be sent as "
                    + "'Authorization: Bearer <token>' on protected endpoints.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Authenticated; JWT returned",
                    content = @Content(schema = @Schema(implementation = AuthResponse.class))),
            @ApiResponse(responseCode = "401", description = "Invalid email or password",
                    content = @Content(schema = @Schema(example = "{\"error\":\"Invalid email or password\"}")))
    })
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            AuthResponse response = authService.login(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(401).body(Map.of("error", "Invalid email or password"));
        }
    }
}
