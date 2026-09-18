# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Student Sharing Portal: a study-material sharing platform with a Spring Boot REST backend (`Backend/StudentSharingPortal`) and a React (Vite) frontend (`Frontend/student-portal`). Students upload documents (PDF/PPT), get an AI-generated summary via Gemini, rate materials, and admins moderate uploads.

## Commands

### Backend (`Backend/StudentSharingPortal`)

```bash
./mvnw spring-boot:run                        # run the API on :8080
./mvnw test                                    # run all tests
./mvnw test -Dtest=AiSummaryServiceTest         # run a single test class
./mvnw test -Dtest=AiSummaryServiceTest#methodName   # run a single test method
./mvnw package                                 # build the jar
```

Requires a local MySQL instance (`student_portal` DB, see `src/main/resources/application.properties` for credentials/URL). `spring.jpa.hibernate.ddl-auto=update` means schema is auto-migrated from entities — no separate migration step. `GEMINI_API_KEY` env var is required for AI summarization to actually call Gemini (falls back to empty key otherwise).

### Frontend (`Frontend/student-portal`)

```bash
npm run dev        # vite dev server
npm run build       # production build to dist/
npm run lint        # eslint
npm run preview     # preview production build
```

## Architecture

### Backend — layered Spring Boot app

Package root: `com.project.StudentSharingPortal`

- **Controller** → **Services** → **Repository** → **Entity**, with **DTO**s used for all controller-facing request/response shapes (entities are never returned directly).
- `Config/SecurityConfig.java` defines the auth rules: `/api/auth/**`, material listing/detail/download are public; everything under `/api/admin/**` requires `ROLE_ADMIN`; all other endpoints require authentication. Auth is stateless JWT (`JWT/JwtFilter.java`, `JWT/JwtUtil.java`) — no sessions.
- **AI summarization pipeline** (`Services/AiSummaryService.java`): orchestrates `TextExtractionService` (Apache Tika + Tess4J/OpenCV OCR fallback for scanned docs) → `GeminiSummaryService` (calls Gemini 2.5 Flash) → caches the result on the `StudyMaterial` entity (`aiSummary`, `aiSummaryGeneratedAt`) so repeat requests are free unless `regenerate=true` is passed, in which case the caller must be the uploader or an admin.
- Only `APPROVED` materials can be summarized — moderation status gates this feature.
- File uploads are stored on disk under `file.upload-dir` (`./uploads`), not in the DB; the DB stores metadata/paths.
- Tesseract OCR language data lives in `tessdata/` (`tesseract.datapath`) and is required at runtime for `TextExtractionService`'s OCR fallback.

### Frontend — React 19 + Vite, client-side routed SPA

- Routing in `src/App.jsx`: public routes (`/login`, `/register`) vs. protected routes wrapped in `ProtectedRoute` (`/`, `/upload`, `/profile`, `/admin`).
- Global state via React Context: `context/AuthContext.jsx` (auth/JWT/user) and `context/ThemeContext.jsx` (theme), both wrapping the whole app.
- `api/axios.js` is the single HTTP client entry point to the backend.
- `pages/` holds route-level screens; `components/` holds shared UI (`Navbar`, `MaterialCard`, `ProtectedRoute`).
