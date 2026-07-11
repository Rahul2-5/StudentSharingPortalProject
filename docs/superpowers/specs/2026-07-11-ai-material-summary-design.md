# AI Material Summary — Design Spec

Status: Approved
Scope: Backend only (Spring Boot). Frontend integration is a separate future task.

## Purpose

Let a logged-in user get an AI-generated summary of an approved study material's actual content (not just its title/description). This is the one AI feature being built now, ahead of the rest of the PRD's H3/H4 AI roadmap.

## Components and responsibilities

| Component | Responsibility | Why chosen |
|---|---|---|
| Apache Tika (`tika-core`, `tika-parsers-standard-package`) | Extract raw text from PDF and PPT files | Free, pure-Java, no external service |
| Tess4J (Tesseract Java bindings) | OCR — extract text from IMAGE materials | Free, embeds in the JVM, no Python runtime needed |
| OpenCV (via `javacv-platform`) | Preprocess images (grayscale, deskew, threshold) before OCR | Improves Tesseract accuracy on photographed notes |
| Gemini 2.5 Flash (Google, REST API via `RestTemplate`) | Generate the actual summary from extracted text | Free tier, fast, sufficient quality for summarization |
| New `StudyMaterial` columns: `aiSummary`, `aiSummaryGeneratedAt` | Cache the generated summary | Avoid re-extracting/re-calling the AI on every request |

No new HTTP client dependency is needed for Gemini — Spring's built-in `RestTemplate` (already available via `spring-boot-starter-web`) is used to call the Gemini REST endpoint directly.

## API

```
POST /api/materials/{id}/summarize?regenerate=false
```

- Auth required (covered by the existing `anyRequest().authenticated()` Spring Security rule — no `SecurityConfig` changes needed).
- Returns the material's `StudyMaterialDTO`, which now includes `aiSummary` and `aiSummaryGeneratedAt`.

### Rules

1. Material must have `status == APPROVED`. Otherwise: 400, `"Material is not available for summarization"`.
2. If a cached `aiSummary` exists and `regenerate` is not `true`: return it immediately. No extraction, no AI call.
3. If `regenerate=true`: only the material's uploader or a user with `role == ADMIN` may trigger it. Otherwise: 400, `"You are not authorized to regenerate this summary"`.
4. Text extraction is chosen by `category`:
   - `PDF`, `PPT` → Apache Tika reads the stored file directly.
   - `IMAGE` → OpenCV preprocesses the image, then Tess4J (Tesseract) performs OCR.
5. Extracted text is truncated to a configurable max length (`ai.summary.max-input-chars`, default 15000) before being sent to Gemini — bounds request size and cost.
6. On successful generation, `aiSummary` and `aiSummaryGeneratedAt` are saved on the `StudyMaterial` row (same transaction as the read — simple `save()` after mutation, consistent with existing service patterns in this codebase).
7. Any extraction or AI-call failure is caught and surfaced as a clear `RuntimeException` message (e.g. "Could not extract readable text from this file", "AI summary service is temporarily unavailable") — following the existing controller convention in this codebase of catching `RuntimeException` and returning `400` with `{"error": message}`.

## Data model changes

`StudyMaterial` entity — two new nullable columns (picked up automatically since `spring.jpa.hibernate.ddl-auto=update` in this project):

- `aiSummary` — `LONGTEXT`, nullable
- `aiSummaryGeneratedAt` — `LocalDateTime`, nullable

`StudyMaterialDTO` — same two fields added, so a cached summary is included in the normal `GET /api/materials/{id}` response too, with no extra call needed once generated.

## New service classes

- `TextExtractionService` — routes to Tika or (OpenCV + Tess4J) based on `StudyMaterial.Category`; throws a clear error on failure or empty output.
- `GeminiSummaryService` — builds the summarization prompt, calls the Gemini API, parses out the summary text from the response JSON.
- `AiSummaryService` — orchestrates: load material → validate status → check cache → check regenerate authorization → extract → truncate → summarize → persist → return.

## Controller change

One new endpoint added to the existing `StudyMaterialController`, following its existing style (constructor/field injection via `@Autowired`, `ResponseEntity<?>` return, try/catch around `RuntimeException` → `400`).

## Configuration (`application.properties`)

```properties
gemini.api.key=${GEMINI_API_KEY:}
gemini.model=gemini-2.5-flash
ai.summary.max-input-chars=15000
tesseract.datapath=./tessdata
```

`GEMINI_API_KEY` is read from the environment only. It is never committed to the repository or written into any file by the implementation.

## Out of scope (explicitly not building now)

- Async/background generation at upload time (PRD's original `extracted_text` idea) — this feature is on-demand only.
- Handwriting recognition quality improvements — Tesseract handles printed/typed text; true cursive handwriting OCR remains a known gap (matches the PRD's own H3 note that OCR/handwriting is a future-roadmap item).
- Frontend UI for triggering or displaying the summary.
- Rate limiting / cost controls beyond the input-length truncation.
