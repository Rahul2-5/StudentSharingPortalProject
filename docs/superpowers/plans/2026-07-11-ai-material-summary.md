# AI Material Summary Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a backend-only endpoint that generates and caches an AI summary of an approved study material's actual content, using Tika/OCR for text extraction and Gemini 2.5 Flash for summarization.

**Architecture:** Three new focused service classes sit behind one new controller endpoint: `TextExtractionService` (Tika for PDF/PPT, OpenCV+Tesseract OCR for images) → `GeminiSummaryService` (calls the Gemini REST API) → `AiSummaryService` (orchestrates caching, authorization, and persistence, reusing the existing `StudyMaterialRepository`/`UserRepository`). The result is cached on the `StudyMaterial` row so repeat requests skip extraction and the AI call entirely.

**Tech Stack:** Spring Boot 3.2.3, Java 17, Apache Tika 2.9.2, Tess4J 5.11.0 (Tesseract OCR bindings), Bytedeco `opencv-platform` 4.9.0-1.5.10, Google Gemini 2.5 Flash via `RestTemplate` (no Gemini SDK needed), JUnit 5 + Mockito (already provided by `spring-boot-starter-test`).

## Global Constraints

- Java 17, Spring Boot 3.2.3 — match versions already pinned in `Backend/StudentSharingPortal/pom.xml`.
- `spring.jpa.hibernate.ddl-auto=update` is already set — new entity columns are picked up automatically, no Flyway/migration needed.
- Follow the existing controller error convention exactly: catch `RuntimeException` in the controller and return `ResponseEntity.badRequest().body(Map.of("error", e.getMessage()))` — do not introduce a new error envelope.
- Services use Spring field injection (`@Autowired private X x;`), not constructor injection — match the existing style in `StudyMaterialService`/`AuthService`.
- The Gemini API key is **never** written to any file. It is read only from the `GEMINI_API_KEY` environment variable via `${GEMINI_API_KEY:}` in `application.properties`.
- All new dependencies (Tika, Tess4J, OpenCV) are free/open-source with no external account or paid tier required.
- Work happens inside `Backend/StudentSharingPortal/` — run all Maven commands from that directory.

---

### Task 1: Dependencies, configuration, and Tesseract language data

**Files:**
- Modify: `Backend/StudentSharingPortal/pom.xml`
- Modify: `Backend/StudentSharingPortal/src/main/resources/application.properties`
- Create: `Backend/StudentSharingPortal/tessdata/eng.traineddata` (binary asset, downloaded not written)

**Interfaces:**
- Produces: Maven dependencies `org.apache.tika:tika-core`, `org.apache.tika:tika-parsers-standard-package`, `net.sourceforge.tess4j:tess4j`, `org.bytedeco:opencv-platform` available on the classpath for later tasks. Config properties `gemini.api.key`, `gemini.model`, `ai.summary.max-input-chars`, `tesseract.datapath` available for later tasks to `@Value`-inject.

- [ ] **Step 1: Add the new dependencies to `pom.xml`**

Insert this block into `Backend/StudentSharingPortal/pom.xml` right after the closing `</dependency>` of the `jjwt-jackson` dependency (i.e. after the JWT dependency group, before the Lombok dependency):

```xml
		<!-- Apache Tika - text extraction from PDF/PPT -->
		<dependency>
			<groupId>org.apache.tika</groupId>
			<artifactId>tika-core</artifactId>
			<version>2.9.2</version>
		</dependency>
		<dependency>
			<groupId>org.apache.tika</groupId>
			<artifactId>tika-parsers-standard-package</artifactId>
			<version>2.9.2</version>
		</dependency>

		<!-- Tess4J - Tesseract OCR Java bindings -->
		<dependency>
			<groupId>net.sourceforge.tess4j</groupId>
			<artifactId>tess4j</artifactId>
			<version>5.11.0</version>
		</dependency>

		<!-- OpenCV (Bytedeco) - image preprocessing before OCR -->
		<dependency>
			<groupId>org.bytedeco</groupId>
			<artifactId>opencv-platform</artifactId>
			<version>4.9.0-1.5.10</version>
		</dependency>
```

- [ ] **Step 2: Add AI summary configuration to `application.properties`**

Append this block to `Backend/StudentSharingPortal/src/main/resources/application.properties`, right after the `# JWT` section and before the `# Server` section:

```properties
# AI Summary
gemini.api.key=${GEMINI_API_KEY:}
gemini.model=gemini-2.5-flash
ai.summary.max-input-chars=15000
tesseract.datapath=./tessdata
```

- [ ] **Step 3: Download the Tesseract English language data**

Run from `Backend/StudentSharingPortal`:

```bash
mkdir -p tessdata
curl -L -o tessdata/eng.traineddata https://github.com/tesseract-ocr/tessdata/raw/main/eng.traineddata
```

Expected: `tessdata/eng.traineddata` exists and is roughly 10-15 MB. This file is required at runtime and by the OCR test in Task 3 — without it, Tesseract throws `TesseractException: Unable to create Tesseract instance` when it tries to load the English model.

- [ ] **Step 4: Verify the project still compiles with the new dependencies**

Run from `Backend/StudentSharingPortal`:

```bash
mvn -q compile
```

Expected: command exits with no output and exit code 0 (Maven downloads the new dependencies on first run — this may take a minute).

- [ ] **Step 5: Commit**

```bash
git add pom.xml src/main/resources/application.properties tessdata/eng.traineddata
git commit -m "chore: add Tika, Tess4J, and OpenCV dependencies for AI text extraction"
```

---

### Task 2: Entity and DTO fields for the cached AI summary

**Files:**
- Modify: `Backend/StudentSharingPortal/src/main/java/com/project/StudentSharingPortal/Entity/StudyMaterial.java`
- Modify: `Backend/StudentSharingPortal/src/main/java/com/project/StudentSharingPortal/DTO/StudyMaterialDTO.java`
- Modify: `Backend/StudentSharingPortal/src/main/java/com/project/StudentSharingPortal/Services/StudyMaterialService.java`
- Test: `Backend/StudentSharingPortal/src/test/java/com/project/StudentSharingPortal/Services/StudyMaterialServiceToDtoTest.java`

**Interfaces:**
- Produces: `StudyMaterial.getAiSummary()` / `.setAiSummary(String)`, `StudyMaterial.getAiSummaryGeneratedAt()` / `.setAiSummaryGeneratedAt(LocalDateTime)`. `StudyMaterialDTO` fields `aiSummary` (String), `aiSummaryGeneratedAt` (LocalDateTime). `StudyMaterialService.toDTO(StudyMaterial m)` becomes **public** (was `private`) and maps both new fields — later tasks (`AiSummaryService`) call this method directly.

- [ ] **Step 1: Write the failing test**

Create `Backend/StudentSharingPortal/src/test/java/com/project/StudentSharingPortal/Services/StudyMaterialServiceToDtoTest.java`:

```java
package com.project.StudentSharingPortal.Services;

import com.project.StudentSharingPortal.DTO.StudyMaterialDTO;
import com.project.StudentSharingPortal.Entity.StudyMaterial;
import com.project.StudentSharingPortal.Entity.User;
import com.project.StudentSharingPortal.Repository.DocumentRatingRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StudyMaterialServiceToDtoTest {

    @Mock
    private DocumentRatingRepository ratingRepository;

    @InjectMocks
    private StudyMaterialService studyMaterialService;

    @Test
    void toDtoMapsAiSummaryFields() {
        User uploader = User.builder()
                .id(1L)
                .name("Test User")
                .email("t@test.com")
                .college("Test College")
                .build();
        LocalDateTime generatedAt = LocalDateTime.of(2026, 7, 11, 10, 0);
        StudyMaterial material = StudyMaterial.builder()
                .id(5L)
                .title("Notes")
                .category(StudyMaterial.Category.PDF)
                .status(StudyMaterial.MaterialStatus.APPROVED)
                .uploader(uploader)
                .aiSummary("A short summary")
                .aiSummaryGeneratedAt(generatedAt)
                .build();

        when(ratingRepository.findAverageScoreByMaterial(material)).thenReturn(null);
        when(ratingRepository.countByMaterial(material)).thenReturn(0);

        StudyMaterialDTO dto = studyMaterialService.toDTO(material);

        assertEquals("A short summary", dto.getAiSummary());
        assertEquals(generatedAt, dto.getAiSummaryGeneratedAt());
    }
}
```

- [ ] **Step 2: Run the test to verify it fails**

Run from `Backend/StudentSharingPortal`:

```bash
mvn -q test -Dtest=StudyMaterialServiceToDtoTest
```

Expected: FAIL — compile error, because `StudyMaterial` has no `aiSummary`/`aiSummaryGeneratedAt` builder methods yet and `toDTO` is not accessible (it's `private`).

- [ ] **Step 3: Add the new columns to the `StudyMaterial` entity**

In `Backend/StudentSharingPortal/src/main/java/com/project/StudentSharingPortal/Entity/StudyMaterial.java`, add these two fields immediately after the `uploadedAt` field (before the `public enum Category` block):

```java
    @Column(columnDefinition = "LONGTEXT")
    private String aiSummary;

    private LocalDateTime aiSummaryGeneratedAt;
```

- [ ] **Step 4: Add the matching fields to `StudyMaterialDTO`**

In `Backend/StudentSharingPortal/src/main/java/com/project/StudentSharingPortal/DTO/StudyMaterialDTO.java`, add an import for `java.time.LocalDateTime` is already present; add these two fields after `ratingCount`:

```java
    private String aiSummary;
    private LocalDateTime aiSummaryGeneratedAt;
```

- [ ] **Step 5: Make `toDTO` public and map the new fields**

In `Backend/StudentSharingPortal/src/main/java/com/project/StudentSharingPortal/Services/StudyMaterialService.java`, change the method signature from:

```java
    private StudyMaterialDTO toDTO(StudyMaterial m) {
```

to:

```java
    public StudyMaterialDTO toDTO(StudyMaterial m) {
```

and add these two lines to the builder chain, right after `.ratingCount(count != null ? count : 0)`:

```java
                .aiSummary(m.getAiSummary())
                .aiSummaryGeneratedAt(m.getAiSummaryGeneratedAt())
```

- [ ] **Step 6: Run the test to verify it passes**

Run from `Backend/StudentSharingPortal`:

```bash
mvn -q test -Dtest=StudyMaterialServiceToDtoTest
```

Expected: PASS (`Tests run: 1, Failures: 0, Errors: 0`).

- [ ] **Step 7: Commit**

```bash
git add src/main/java/com/project/StudentSharingPortal/Entity/StudyMaterial.java \
        src/main/java/com/project/StudentSharingPortal/DTO/StudyMaterialDTO.java \
        src/main/java/com/project/StudentSharingPortal/Services/StudyMaterialService.java \
        src/test/java/com/project/StudentSharingPortal/Services/StudyMaterialServiceToDtoTest.java
git commit -m "feat: add cached aiSummary fields to StudyMaterial and DTO"
```

---

### Task 3: TextExtractionService (Tika for PDF/PPT, OpenCV+Tesseract OCR for images)

**Files:**
- Create: `Backend/StudentSharingPortal/src/main/java/com/project/StudentSharingPortal/Services/TextExtractionService.java`
- Test: `Backend/StudentSharingPortal/src/test/java/com/project/StudentSharingPortal/Services/TextExtractionServiceTest.java`

**Interfaces:**
- Consumes: `StudyMaterial.getCategory()` → `StudyMaterial.Category` (`PDF`, `IMAGE`, `PPT`), `StudyMaterial.getFilePath()` → `String`. Config property `tesseract.datapath`.
- Produces: `TextExtractionService.extractText(StudyMaterial material)` → `String`. Throws `RuntimeException` with message `"Could not extract readable text from this file"` on any extraction failure or empty result, or `"Unsupported category for text extraction: " + category` for an unrecognized category — later tasks (`AiSummaryService`) rely on this exact method name and signature.

- [ ] **Step 1: Write the failing tests**

Create `Backend/StudentSharingPortal/src/test/java/com/project/StudentSharingPortal/Services/TextExtractionServiceTest.java`:

```java
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
    void throwsWhenFileCannotBeExtracted(@org.junit.jupiter.api.io.TempDir Path tempDir) throws Exception {
        ReflectionTestUtils.setField(service, "tesseractDataPath", "./tessdata");

        Path badPdf = tempDir.resolve("broken.pdf");
        java.nio.file.Files.writeString(badPdf, "not a real pdf");

        StudyMaterial material = StudyMaterial.builder()
                .category(StudyMaterial.Category.PDF)
                .filePath(badPdf.toString())
                .build();

        assertThrows(RuntimeException.class, () -> service.extractText(material));
    }
}
```

Run this from `Backend/StudentSharingPortal` (the project's working directory is where `./tessdata` resolves from, matching `application.properties`).

- [ ] **Step 2: Run the tests to verify they fail**

```bash
mvn -q test -Dtest=TextExtractionServiceTest
```

Expected: FAIL — `TextExtractionService` class does not exist yet (compile error).

- [ ] **Step 3: Implement `TextExtractionService`**

Create `Backend/StudentSharingPortal/src/main/java/com/project/StudentSharingPortal/Services/TextExtractionService.java`:

```java
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
```

- [ ] **Step 4: Run the tests to verify they pass**

```bash
mvn -q test -Dtest=TextExtractionServiceTest
```

Expected: PASS (`Tests run: 3, Failures: 0, Errors: 0`). The OCR test depends on `tessdata/eng.traineddata` from Task 1 — if it fails with a Tesseract initialization error, re-check that file exists.

- [ ] **Step 5: Commit**

```bash
git add src/main/java/com/project/StudentSharingPortal/Services/TextExtractionService.java \
        src/test/java/com/project/StudentSharingPortal/Services/TextExtractionServiceTest.java
git commit -m "feat: add TextExtractionService (Tika + OpenCV/Tesseract OCR)"
```

---

### Task 4: GeminiSummaryService (calls the Gemini API)

**Files:**
- Create: `Backend/StudentSharingPortal/src/main/java/com/project/StudentSharingPortal/Config/RestTemplateConfig.java`
- Create: `Backend/StudentSharingPortal/src/main/java/com/project/StudentSharingPortal/Services/GeminiSummaryService.java`
- Test: `Backend/StudentSharingPortal/src/test/java/com/project/StudentSharingPortal/Services/GeminiSummaryServiceTest.java`

**Interfaces:**
- Consumes: Config properties `gemini.api.key`, `gemini.model`.
- Produces: `GeminiSummaryService.summarize(String extractedText)` → `String` (the AI-generated summary, trimmed). Throws `RuntimeException("AI summary service is temporarily unavailable")` on any network error or unparseable response — `AiSummaryService` (Task 5) relies on this exact method name and signature.

- [ ] **Step 1: Write the failing tests**

Create `Backend/StudentSharingPortal/src/test/java/com/project/StudentSharingPortal/Services/GeminiSummaryServiceTest.java`:

```java
package com.project.StudentSharingPortal.Services;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GeminiSummaryServiceTest {

    @Mock
    private RestTemplate restTemplate;

    @InjectMocks
    private GeminiSummaryService geminiSummaryService;

    @Test
    void summarizeReturnsTextFromGeminiResponse() {
        ReflectionTestUtils.setField(geminiSummaryService, "apiKey", "test-key");
        ReflectionTestUtils.setField(geminiSummaryService, "model", "gemini-2.5-flash");

        Map<String, Object> geminiResponse = Map.of(
                "candidates", List.of(Map.of(
                        "content", Map.of(
                                "parts", List.of(Map.of("text", "  This is the summary.  "))
                        )
                ))
        );
        when(restTemplate.postForObject(any(String.class), any(), eq(Map.class)))
                .thenReturn(geminiResponse);

        String result = geminiSummaryService.summarize("some extracted text");

        assertEquals("This is the summary.", result);
    }

    @Test
    void summarizeThrowsWhenGeminiCallFails() {
        ReflectionTestUtils.setField(geminiSummaryService, "apiKey", "test-key");
        ReflectionTestUtils.setField(geminiSummaryService, "model", "gemini-2.5-flash");

        when(restTemplate.postForObject(any(String.class), any(), eq(Map.class)))
                .thenThrow(new RestClientException("boom"));

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> geminiSummaryService.summarize("some extracted text"));
        assertEquals("AI summary service is temporarily unavailable", ex.getMessage());
    }

    @Test
    void summarizeThrowsWhenResponseHasNoCandidates() {
        ReflectionTestUtils.setField(geminiSummaryService, "apiKey", "test-key");
        ReflectionTestUtils.setField(geminiSummaryService, "model", "gemini-2.5-flash");

        when(restTemplate.postForObject(any(String.class), any(), eq(Map.class)))
                .thenReturn(Map.of("candidates", List.of()));

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> geminiSummaryService.summarize("some extracted text"));
        assertEquals("AI summary service is temporarily unavailable", ex.getMessage());
    }
}
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
mvn -q test -Dtest=GeminiSummaryServiceTest
```

Expected: FAIL — `GeminiSummaryService` class does not exist yet (compile error).

- [ ] **Step 3: Create the `RestTemplate` bean**

Create `Backend/StudentSharingPortal/src/main/java/com/project/StudentSharingPortal/Config/RestTemplateConfig.java`:

```java
package com.project.StudentSharingPortal.Config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

@Configuration
public class RestTemplateConfig {

    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}
```

- [ ] **Step 4: Implement `GeminiSummaryService`**

Create `Backend/StudentSharingPortal/src/main/java/com/project/StudentSharingPortal/Services/GeminiSummaryService.java`:

```java
package com.project.StudentSharingPortal.Services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Service
public class GeminiSummaryService {

    @Autowired
    private RestTemplate restTemplate;

    @Value("${gemini.api.key}")
    private String apiKey;

    @Value("${gemini.model}")
    private String model;

    public String summarize(String extractedText) {
        String url = "https://generativelanguage.googleapis.com/v1beta/models/"
                + model + ":generateContent?key=" + apiKey;

        String prompt = "Summarize the following study material content in 3 to 5 concise "
                + "sentences, focused on the key concepts a student needs to know:\n\n" + extractedText;

        Map<String, Object> requestBody = Map.of(
                "contents", List.of(Map.of(
                        "parts", List.of(Map.of("text", prompt))
                ))
        );

        Map<String, Object> responseBody;
        try {
            responseBody = restTemplate.postForObject(url, requestBody, Map.class);
        } catch (RestClientException e) {
            throw new RuntimeException("AI summary service is temporarily unavailable");
        }

        return extractSummaryText(responseBody);
    }

    @SuppressWarnings("unchecked")
    private String extractSummaryText(Map<String, Object> body) {
        if (body == null) {
            throw new RuntimeException("AI summary service is temporarily unavailable");
        }
        List<Map<String, Object>> candidates = (List<Map<String, Object>>) body.get("candidates");
        if (candidates == null || candidates.isEmpty()) {
            throw new RuntimeException("AI summary service is temporarily unavailable");
        }
        Map<String, Object> content = (Map<String, Object>) candidates.get(0).get("content");
        if (content == null) {
            throw new RuntimeException("AI summary service is temporarily unavailable");
        }
        List<Map<String, Object>> parts = (List<Map<String, Object>>) content.get("parts");
        if (parts == null || parts.isEmpty()) {
            throw new RuntimeException("AI summary service is temporarily unavailable");
        }
        String text = (String) parts.get(0).get("text");
        if (text == null || text.isBlank()) {
            throw new RuntimeException("AI summary service is temporarily unavailable");
        }
        return text.trim();
    }
}
```

- [ ] **Step 5: Run the tests to verify they pass**

```bash
mvn -q test -Dtest=GeminiSummaryServiceTest
```

Expected: PASS (`Tests run: 3, Failures: 0, Errors: 0`).

- [ ] **Step 6: Commit**

```bash
git add src/main/java/com/project/StudentSharingPortal/Config/RestTemplateConfig.java \
        src/main/java/com/project/StudentSharingPortal/Services/GeminiSummaryService.java \
        src/test/java/com/project/StudentSharingPortal/Services/GeminiSummaryServiceTest.java
git commit -m "feat: add GeminiSummaryService calling the Gemini 2.5 Flash API"
```

---

### Task 5: AiSummaryService (orchestration: caching + authorization + persistence)

**Files:**
- Create: `Backend/StudentSharingPortal/src/main/java/com/project/StudentSharingPortal/Services/AiSummaryService.java`
- Test: `Backend/StudentSharingPortal/src/test/java/com/project/StudentSharingPortal/Services/AiSummaryServiceTest.java`

**Interfaces:**
- Consumes: `StudyMaterialRepository.findById(Long)` → `Optional<StudyMaterial>`, `.save(StudyMaterial)` → `StudyMaterial` (already exist). `UserRepository.findByEmail(String)` → `Optional<User>` (already exists). `TextExtractionService.extractText(StudyMaterial)` → `String` (Task 3). `GeminiSummaryService.summarize(String)` → `String` (Task 4). `StudyMaterialService.toDTO(StudyMaterial)` → `StudyMaterialDTO` (Task 2, now public). Config property `ai.summary.max-input-chars`.
- Produces: `AiSummaryService.getOrGenerateSummary(Long materialId, String requesterEmail, boolean regenerate)` → `StudyMaterialDTO` — the controller (Task 6) calls this exact method.

- [ ] **Step 1: Write the failing tests**

Create `Backend/StudentSharingPortal/src/test/java/com/project/StudentSharingPortal/Services/AiSummaryServiceTest.java`:

```java
package com.project.StudentSharingPortal.Services;

import com.project.StudentSharingPortal.DTO.StudyMaterialDTO;
import com.project.StudentSharingPortal.Entity.StudyMaterial;
import com.project.StudentSharingPortal.Entity.User;
import com.project.StudentSharingPortal.Repository.StudyMaterialRepository;
import com.project.StudentSharingPortal.Repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AiSummaryServiceTest {

    @Mock private StudyMaterialRepository studyMaterialRepository;
    @Mock private UserRepository userRepository;
    @Mock private TextExtractionService textExtractionService;
    @Mock private GeminiSummaryService geminiSummaryService;
    @Mock private StudyMaterialService studyMaterialService;

    @InjectMocks
    private AiSummaryService aiSummaryService;

    private User uploader;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(aiSummaryService, "maxInputChars", 15000);
        uploader = User.builder().id(1L).email("uploader@test.com").role("STUDENT").build();
    }

    private StudyMaterial approvedMaterial(String cachedSummary) {
        return StudyMaterial.builder()
                .id(10L)
                .status(StudyMaterial.MaterialStatus.APPROVED)
                .category(StudyMaterial.Category.PDF)
                .filePath("/tmp/does-not-matter.pdf")
                .uploader(uploader)
                .aiSummary(cachedSummary)
                .build();
    }

    @Test
    void returnsCachedSummaryWithoutCallingExtractionOrGemini() {
        StudyMaterial material = approvedMaterial("already summarized");
        when(studyMaterialRepository.findById(10L)).thenReturn(Optional.of(material));
        when(studyMaterialService.toDTO(material)).thenReturn(new StudyMaterialDTO());

        aiSummaryService.getOrGenerateSummary(10L, "uploader@test.com", false);

        verify(textExtractionService, never()).extractText(any());
        verify(geminiSummaryService, never()).summarize(anyString());
        verify(studyMaterialRepository, never()).save(any());
    }

    @Test
    void throwsWhenMaterialIsNotApproved() {
        StudyMaterial material = approvedMaterial(null);
        material.setStatus(StudyMaterial.MaterialStatus.PENDING);
        when(studyMaterialRepository.findById(10L)).thenReturn(Optional.of(material));

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> aiSummaryService.getOrGenerateSummary(10L, "uploader@test.com", false));

        assertEquals("Material is not available for summarization", ex.getMessage());
    }

    @Test
    void generatesAndSavesSummaryWhenNoneCached() {
        StudyMaterial material = approvedMaterial(null);
        when(studyMaterialRepository.findById(10L)).thenReturn(Optional.of(material));
        when(textExtractionService.extractText(material)).thenReturn("extracted text");
        when(geminiSummaryService.summarize("extracted text")).thenReturn("a summary");
        when(studyMaterialRepository.save(material)).thenReturn(material);
        when(studyMaterialService.toDTO(material)).thenReturn(new StudyMaterialDTO());

        aiSummaryService.getOrGenerateSummary(10L, "uploader@test.com", false);

        assertEquals("a summary", material.getAiSummary());
        verify(studyMaterialRepository, times(1)).save(material);
    }

    @Test
    void regenerateByNonOwnerNonAdminThrows() {
        StudyMaterial material = approvedMaterial("old summary");
        when(studyMaterialRepository.findById(10L)).thenReturn(Optional.of(material));
        when(userRepository.findByEmail("stranger@test.com"))
                .thenReturn(Optional.of(User.builder().email("stranger@test.com").role("STUDENT").build()));

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> aiSummaryService.getOrGenerateSummary(10L, "stranger@test.com", true));

        assertEquals("You are not authorized to regenerate this summary", ex.getMessage());
        verify(textExtractionService, never()).extractText(any());
    }

    @Test
    void regenerateByAdminSucceedsEvenIfNotOwner() {
        StudyMaterial material = approvedMaterial("old summary");
        when(studyMaterialRepository.findById(10L)).thenReturn(Optional.of(material));
        when(userRepository.findByEmail("admin@test.com"))
                .thenReturn(Optional.of(User.builder().email("admin@test.com").role("ADMIN").build()));
        when(textExtractionService.extractText(material)).thenReturn("extracted text");
        when(geminiSummaryService.summarize("extracted text")).thenReturn("new summary");
        when(studyMaterialRepository.save(material)).thenReturn(material);
        when(studyMaterialService.toDTO(material)).thenReturn(new StudyMaterialDTO());

        aiSummaryService.getOrGenerateSummary(10L, "admin@test.com", true);

        assertEquals("new summary", material.getAiSummary());
    }

    @Test
    void truncatesExtractedTextBeforeSummarizing() {
        ReflectionTestUtils.setField(aiSummaryService, "maxInputChars", 10);
        StudyMaterial material = approvedMaterial(null);
        String longText = "0123456789ABCDEF";
        when(studyMaterialRepository.findById(10L)).thenReturn(Optional.of(material));
        when(textExtractionService.extractText(material)).thenReturn(longText);
        when(geminiSummaryService.summarize("0123456789")).thenReturn("summary");
        when(studyMaterialRepository.save(material)).thenReturn(material);
        when(studyMaterialService.toDTO(material)).thenReturn(new StudyMaterialDTO());

        aiSummaryService.getOrGenerateSummary(10L, "uploader@test.com", false);

        verify(geminiSummaryService).summarize("0123456789");
    }
}
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
mvn -q test -Dtest=AiSummaryServiceTest
```

Expected: FAIL — `AiSummaryService` class does not exist yet (compile error).

- [ ] **Step 3: Implement `AiSummaryService`**

Create `Backend/StudentSharingPortal/src/main/java/com/project/StudentSharingPortal/Services/AiSummaryService.java`:

```java
package com.project.StudentSharingPortal.Services;

import com.project.StudentSharingPortal.DTO.StudyMaterialDTO;
import com.project.StudentSharingPortal.Entity.StudyMaterial;
import com.project.StudentSharingPortal.Entity.User;
import com.project.StudentSharingPortal.Repository.StudyMaterialRepository;
import com.project.StudentSharingPortal.Repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class AiSummaryService {

    @Autowired
    private StudyMaterialRepository studyMaterialRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TextExtractionService textExtractionService;

    @Autowired
    private GeminiSummaryService geminiSummaryService;

    @Autowired
    private StudyMaterialService studyMaterialService;

    @Value("${ai.summary.max-input-chars}")
    private int maxInputChars;

    public StudyMaterialDTO getOrGenerateSummary(Long materialId, String requesterEmail, boolean regenerate) {
        StudyMaterial material = studyMaterialRepository.findById(materialId)
                .orElseThrow(() -> new RuntimeException("Material not found"));

        if (material.getStatus() != StudyMaterial.MaterialStatus.APPROVED) {
            throw new RuntimeException("Material is not available for summarization");
        }

        if (material.getAiSummary() != null && !regenerate) {
            return studyMaterialService.toDTO(material);
        }

        if (regenerate) {
            requireOwnerOrAdmin(material, requesterEmail);
        }

        String extractedText = textExtractionService.extractText(material);
        String truncatedText = extractedText.length() > maxInputChars
                ? extractedText.substring(0, maxInputChars)
                : extractedText;

        String summary = geminiSummaryService.summarize(truncatedText);

        material.setAiSummary(summary);
        material.setAiSummaryGeneratedAt(LocalDateTime.now());
        StudyMaterial saved = studyMaterialRepository.save(material);

        return studyMaterialService.toDTO(saved);
    }

    private void requireOwnerOrAdmin(StudyMaterial material, String requesterEmail) {
        boolean isOwner = material.getUploader().getEmail().equals(requesterEmail);
        if (isOwner) {
            return;
        }
        User requester = userRepository.findByEmail(requesterEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (!"ADMIN".equals(requester.getRole())) {
            throw new RuntimeException("You are not authorized to regenerate this summary");
        }
    }
}
```

- [ ] **Step 4: Run the tests to verify they pass**

```bash
mvn -q test -Dtest=AiSummaryServiceTest
```

Expected: PASS (`Tests run: 6, Failures: 0, Errors: 0`).

- [ ] **Step 5: Commit**

```bash
git add src/main/java/com/project/StudentSharingPortal/Services/AiSummaryService.java \
        src/test/java/com/project/StudentSharingPortal/Services/AiSummaryServiceTest.java
git commit -m "feat: add AiSummaryService orchestrating caching, auth, and generation"
```

---

### Task 6: Controller endpoint

**Files:**
- Modify: `Backend/StudentSharingPortal/src/main/java/com/project/StudentSharingPortal/Controller/StudyMaterialController.java`

**Interfaces:**
- Consumes: `AiSummaryService.getOrGenerateSummary(Long, String, boolean)` → `StudyMaterialDTO` (Task 5).
- Produces: `POST /api/materials/{id}/summarize?regenerate=false` — no other task depends on this; it is the feature's public surface.

- [ ] **Step 1: Add the `AiSummaryService` field**

In `Backend/StudentSharingPortal/src/main/java/com/project/StudentSharingPortal/Controller/StudyMaterialController.java`, add this field right after the existing `studyMaterialService` field:

```java
    @Autowired
    private AiSummaryService aiSummaryService;
```

Add the matching import near the top of the file, alongside the existing `StudyMaterialService` import:

```java
import com.project.StudentSharingPortal.Services.AiSummaryService;
```

- [ ] **Step 2: Add the summarize endpoint**

Add this method to `StudyMaterialController`, right after the existing `rateMaterial` method:

```java
    /** Get or generate an AI summary for an approved material (requires auth) */
    @PostMapping("/{id}/summarize")
    public ResponseEntity<?> summarize(
            @PathVariable Long id,
            @RequestParam(value = "regenerate", defaultValue = "false") boolean regenerate,
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            StudyMaterialDTO dto = aiSummaryService.getOrGenerateSummary(id, userDetails.getUsername(), regenerate);
            return ResponseEntity.ok(dto);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
```

- [ ] **Step 3: Verify the project compiles**

Run from `Backend/StudentSharingPortal`:

```bash
mvn -q compile
```

Expected: command exits with no output and exit code 0.

- [ ] **Step 4: Manually verify the endpoint end-to-end**

This codebase has no existing controller/security test harness (no `MockMvc`/`@WebMvcTest` setup), so verify manually, matching how the rest of this controller is tested:

1. Start the app: `mvn spring-boot:run` (requires local MySQL running per `application.properties`, and `GEMINI_API_KEY` set as an environment variable).
2. Log in via `POST /api/auth/login` to get a JWT (use an account tied to an already-`APPROVED` material — approve one via the admin endpoint first if needed).
3. Call:
   ```bash
   curl -X POST "http://localhost:8080/api/materials/<APPROVED_MATERIAL_ID>/summarize" \
     -H "Authorization: Bearer <JWT>"
   ```
4. Expected: `200 OK` with a JSON body containing `"aiSummary"` (non-null) and `"aiSummaryGeneratedAt"`.
5. Call the same request again — expected: the response returns instantly (no Gemini call), confirming the cache path.
6. Call `GET /api/materials/<APPROVED_MATERIAL_ID>` — expected: the response now includes the same `aiSummary`.

- [ ] **Step 5: Commit**

```bash
git add src/main/java/com/project/StudentSharingPortal/Controller/StudyMaterialController.java
git commit -m "feat: add POST /api/materials/{id}/summarize endpoint"
```
