package com.project.StudentSharingPortal.Services;

import com.project.StudentSharingPortal.DTO.UpdateProfileRequest;
import com.project.StudentSharingPortal.DTO.UserProfileDTO;
import com.project.StudentSharingPortal.Entity.User;
import com.project.StudentSharingPortal.Repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    public UserProfileDTO getProfile(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return toDTO(user);
    }

    public UserProfileDTO updateProfile(String email, UpdateProfileRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (request.getName() != null && !request.getName().isBlank()) {
            user.setName(request.getName());
        }
        if (request.getCollege() != null) {
            user.setCollege(request.getCollege());
        }
        if (request.getProgram() != null) {
            user.setProgram(request.getProgram());
        }
        if (request.getSemester() != null) {
            user.setSemester(request.getSemester());
        }

        userRepository.save(user);
        return toDTO(user);
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
