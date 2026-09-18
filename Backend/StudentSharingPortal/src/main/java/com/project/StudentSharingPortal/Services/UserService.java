package com.project.StudentSharingPortal.Services;

import com.project.StudentSharingPortal.DTO.UpdateProfileRequest;
import com.project.StudentSharingPortal.DTO.UserProfileDTO;
import com.project.StudentSharingPortal.DTO.ChangePasswordRequest;
import com.project.StudentSharingPortal.Entity.User;
import com.project.StudentSharingPortal.Repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public UserProfileDTO getProfile(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return toDTO(user);
    }

    public List<UserProfileDTO> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::toDTO)
                .toList();
    }

    public UserProfileDTO updateProfile(String email, UpdateProfileRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (request.getName() != null) {
            String name = request.getName().trim();
            if (name.length() < 2) {
                throw new RuntimeException("Name must be at least 2 characters");
            }
            user.setName(name);
        }
        if (request.getCollege() != null) {
            user.setCollege(request.getCollege());
        }
        if (request.getProgram() != null) {
            user.setProgram(request.getProgram());
        }
        if (request.getSemester() != null) {
            if (request.getSemester() < 1 || request.getSemester() > 8) {
                throw new RuntimeException("Semester must be between 1 and 8");
            }
            user.setSemester(request.getSemester());
        }

        userRepository.save(user);
        return toDTO(user);
    }

    public void changePassword(String email, ChangePasswordRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (request.getCurrentPassword() == null || request.getCurrentPassword().isBlank()) {
            throw new RuntimeException("Current password is required");
        }
        if (request.getNewPassword() == null || request.getNewPassword().length() < 8) {
            throw new RuntimeException("New password must be at least 8 characters");
        }
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new RuntimeException("Current password is incorrect");
        }
        if (passwordEncoder.matches(request.getNewPassword(), user.getPassword())) {
            throw new RuntimeException("New password must be different from the current password");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    private UserProfileDTO toDTO(User user) {
        return UserProfileDTO.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .college(user.getCollege())
                .program(user.getProgram())
                .semester(user.getSemester())
                .role(user.getRole())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
