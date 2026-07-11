package com.project.StudentSharingPortal.Services;

import com.project.StudentSharingPortal.Entity.StudyMaterial;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import javax.imageio.ImageIO;
import java.awt.Color;
import java.awt.Font;
import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class TextExtractionServiceTest {

    private final TextExtractionService service = new TextExtractionService();

    @Test
    void extractsTextFromPdf(@org.junit.jupiter.api.io.TempDir Path tempDir) throws Exception {
        ReflectionTestUtils.setField(service, "tesseractDataPath", "./tessdata");

        Path pdfPath = tempDir.resolve("sample.pdf");
        try (PDDocument document = new PDDocument()) {
            PDPage page = new PDPage();
            document.addPage(page);
            try (PDPageContentStream contentStream = new PDPageContentStream(document, page)) {
                contentStream.beginText();
                contentStream.setFont(PDType1Font.HELVETICA, 12);
                contentStream.newLineAtOffset(50, 700);
                contentStream.showText("test extraction content");
                contentStream.endText();
            }
            document.save(pdfPath.toFile());
        }

        StudyMaterial material = StudyMaterial.builder()
                .category(StudyMaterial.Category.PDF)
                .filePath(pdfPath.toString())
                .build();

        String result = service.extractText(material);

        assertTrue(result.toLowerCase().contains("test extraction content"),
                "expected extracted text to contain the sample sentence, got: " + result);
    }

    @Test
    void extractsTextFromImageViaOcr(@org.junit.jupiter.api.io.TempDir Path tempDir) throws Exception {
        ReflectionTestUtils.setField(service, "tesseractDataPath", "./tessdata");

        Path imagePath = tempDir.resolve("sample.png");
        BufferedImage image = new BufferedImage(300, 100, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = image.createGraphics();
        g.setColor(Color.WHITE);
        g.fillRect(0, 0, 300, 100);
        g.setColor(Color.BLACK);
        g.setFont(new Font("SansSerif", Font.BOLD, 40));
        g.drawString("TEST", 40, 60);
        g.dispose();
        ImageIO.write(image, "png", imagePath.toFile());

        StudyMaterial material = StudyMaterial.builder()
                .category(StudyMaterial.Category.IMAGE)
                .filePath(imagePath.toString())
                .build();

        String result = service.extractText(material);

        assertTrue(result.toUpperCase().contains("TEST"),
                "expected OCR to read the word TEST, got: " + result);
    }

    @Test
    void throwsWhenFileCannotBeExtracted(@org.junit.jupiter.api.io.TempDir Path tempDir) {
        ReflectionTestUtils.setField(service, "tesseractDataPath", "./tessdata");

        Path missingFile = tempDir.resolve("does-not-exist.pdf");

        StudyMaterial material = StudyMaterial.builder()
                .category(StudyMaterial.Category.PDF)
                .filePath(missingFile.toString())
                .build();

        assertThrows(RuntimeException.class, () -> service.extractText(material));
    }
}
