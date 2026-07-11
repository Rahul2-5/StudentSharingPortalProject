package com.project.StudentSharingPortal.Services;

import com.project.StudentSharingPortal.Entity.StudyMaterial;
import net.sourceforge.tess4j.ITesseract;
import net.sourceforge.tess4j.Tesseract;
import net.sourceforge.tess4j.TesseractException;
import org.apache.tika.Tika;
import org.apache.tika.exception.TikaException;
import org.bytedeco.opencv.opencv_core.Mat;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

import static org.bytedeco.opencv.global.opencv_imgcodecs.imread;
import static org.bytedeco.opencv.global.opencv_imgcodecs.imwrite;
import static org.bytedeco.opencv.global.opencv_imgproc.COLOR_BGR2GRAY;
import static org.bytedeco.opencv.global.opencv_imgproc.THRESH_BINARY;
import static org.bytedeco.opencv.global.opencv_imgproc.THRESH_OTSU;
import static org.bytedeco.opencv.global.opencv_imgproc.cvtColor;
import static org.bytedeco.opencv.global.opencv_imgproc.threshold;

@Service
public class TextExtractionService {

    @Value("${tesseract.datapath}")
    private String tesseractDataPath;

    public String extractText(StudyMaterial material) {
        StudyMaterial.Category category = material.getCategory();
        Path filePath = Paths.get(material.getFilePath());

        String text;
        if (category == StudyMaterial.Category.PDF || category == StudyMaterial.Category.PPT) {
            text = extractWithTika(filePath);
        } else if (category == StudyMaterial.Category.IMAGE) {
            text = extractWithOcr(filePath);
        } else {
            throw new RuntimeException("Unsupported category for text extraction: " + category);
        }

        if (text == null || text.isBlank()) {
            throw new RuntimeException("Could not extract readable text from this file");
        }
        return text;
    }

    private String extractWithTika(Path filePath) {
        try {
            return new Tika().parseToString(filePath.toFile());
        } catch (IOException | TikaException e) {
            throw new RuntimeException("Could not extract readable text from this file");
        }
    }

    private String extractWithOcr(Path filePath) {
        Path preprocessed = preprocessImage(filePath);
        try {
            ITesseract tesseract = new Tesseract();
            tesseract.setDatapath(tesseractDataPath);
            return tesseract.doOCR(preprocessed.toFile());
        } catch (TesseractException e) {
            throw new RuntimeException("Could not extract readable text from this file");
        } finally {
            try {
                Files.deleteIfExists(preprocessed);
            } catch (IOException ignored) {
                // best-effort cleanup of the temp preprocessed image
            }
        }
    }

    private Path preprocessImage(Path filePath) {
        try {
            Mat source = imread(filePath.toString());
            Mat gray = new Mat();
            cvtColor(source, gray, COLOR_BGR2GRAY);
            Mat thresholded = new Mat();
            threshold(gray, thresholded, 0, 255, THRESH_BINARY + THRESH_OTSU);

            Path output = Files.createTempFile("ocr-preprocessed-", ".png");
            imwrite(output.toString(), thresholded);
            return output;
        } catch (IOException e) {
            throw new RuntimeException("Could not process image for text extraction");
        }
    }
}
