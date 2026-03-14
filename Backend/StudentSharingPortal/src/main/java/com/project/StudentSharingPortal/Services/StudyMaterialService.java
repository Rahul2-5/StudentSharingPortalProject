package com.project.StudentSharingPortal.Services;

import com.project.StudentSharingPortal.DTO.StudyMaterialDTO;
import com.project.StudentSharingPortal.Entity.StudyMaterial;
import com.project.StudentSharingPortal.Entity.User;
import com.project.StudentSharingPortal.Repository.StudyMaterialRepository;
import com.project.StudentSharingPortal.Repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.*;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class StudyMaterialService {

    @Autowired
    private StudyMaterialRepository studyMaterialRepository;

    @Autowired
    private UserRepository userRepository;

    @Value("${file.upload-dir}")
    private String uploadDir;

    public StudyMaterialDTO upload(MultipartFile file,
                                   String title,
                                   String description,
                                   String materialType,
                                   String subject,
                                   Integer semester,
                                   String uploaderEmail) throws IOException {

        User uploader = userRepository.findByEmail(uploaderEmail)
                .orElseThrow(() -> new RuntimeException("Uploader not found"));

        // Create upload directory if it doesn't exist
        Path uploadPath = Paths.get(uploadDir);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        // Generate unique filename
        String originalFilename = file.getOriginalFilename();
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }
        String storedFileName = UUID.randomUUID().toString() + extension;
        Path filePath = uploadPath.resolve(storedFileName);
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

        StudyMaterial material = StudyMaterial.builder()
                .title(title)
                .description(description)
                .fileName(originalFilename)
                .filePath(filePath.toString())
                .fileType(file.getContentType())
                .fileSize(file.getSize())
                .materialType(StudyMaterial.MaterialType.valueOf(materialType))
                .subject(subject)
                .semester(semester)
                .downloadCount(0)
                .uploader(uploader)
                .build();

        return toDTO(studyMaterialRepository.save(material));
    }

    public List<StudyMaterialDTO> getAll() {
        return studyMaterialRepository.findAllApproved()
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    public List<StudyMaterialDTO> search(String keyword, Integer semester, String materialType) {
        StudyMaterial.MaterialType type = null;
        if (materialType != null && !materialType.isBlank()) {
            type = StudyMaterial.MaterialType.valueOf(materialType);
        }
        return studyMaterialRepository.searchMaterials(keyword, semester, type)
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    public StudyMaterialDTO getById(Long id) {
        return toDTO(studyMaterialRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Material not found with id: " + id)));
    }

    public Resource download(Long id) throws MalformedURLException {
        StudyMaterial material = studyMaterialRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Material not found"));

        material.setDownloadCount(material.getDownloadCount() + 1);
        studyMaterialRepository.save(material);

        Path filePath = Paths.get(material.getFilePath());
        Resource resource = new UrlResource(filePath.toUri());

        if (resource.exists() && resource.isReadable()) {
            return resource;
        } else {
            throw new RuntimeException("Could not read file: " + material.getFileName());
        }
    }

    public void delete(Long id, String uploaderEmail) {
        StudyMaterial material = studyMaterialRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Material not found"));

        if (!material.getUploader().getEmail().equals(uploaderEmail)) {
            throw new RuntimeException("You are not authorized to delete this material");
        }

        // Delete the physical file
        try {
            Files.deleteIfExists(Paths.get(material.getFilePath()));
        } catch (IOException e) {
            // Log but do not fail if file deletion fails
        }

        studyMaterialRepository.deleteById(id);
    }

    public List<StudyMaterialDTO> getMyUploads(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return studyMaterialRepository.findByUploader(user)
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    public List<StudyMaterialDTO> getPendingMaterials() {
        return studyMaterialRepository.findByStatusOrderByUploadedAtDesc(StudyMaterial.MaterialStatus.PENDING)
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    public StudyMaterialDTO updateStatus(Long id, StudyMaterial.MaterialStatus status) {
        StudyMaterial material = studyMaterialRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Material not found with id: " + id));
        material.setStatus(status);
        return toDTO(studyMaterialRepository.save(material));
    }

    private StudyMaterialDTO toDTO(StudyMaterial m) {
        return StudyMaterialDTO.builder()
                .id(m.getId())
                .title(m.getTitle())
                .description(m.getDescription())
                .fileName(m.getFileName())
                .fileType(m.getFileType())
                .fileSize(m.getFileSize())
                .materialType(m.getMaterialType())
                .status(m.getStatus())
                .subject(m.getSubject())
                .semester(m.getSemester())
                .downloadCount(m.getDownloadCount())
                .uploadedAt(m.getUploadedAt())
                .uploaderName(m.getUploader().getName())
                .uploaderId(m.getUploader().getId())
                .uploaderCollege(m.getUploader().getCollege())
                .build();
    }
}
