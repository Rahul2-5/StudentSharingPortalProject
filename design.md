# Student Sharing Portal — Frontend Design Plan

Status: **draft, awaiting approval**. Nothing in this document has been built yet. Once approved, implementation proceeds page by page (this doc, not code, is the thing to argue with).

---

## 1. Ground truth: what the backend actually exposes

The frontend must not call anything outside this list. Verified directly against `Controller/*.java` on 2026-07-12.

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/api/auth/register` | public | returns `AuthResponse` (token, name, email, role, userId, college, program, semester) |
| POST | `/api/auth/login` | public | same `AuthResponse` shape |
| GET | `/api/materials` | public | optional `keyword`, `semester`, `category` query params |
| GET | `/api/materials/{id}` | public | 404 if missing |
| GET | `/api/materials/download/{id}` | public | streams file |
| POST | `/api/materials/upload` | auth | multipart: `file, title, category, description?, subject?, semester?` |
| DELETE | `/api/materials/{id}` | auth + ownership | |
| GET | `/api/materials/my` | auth | current user's uploads |
| POST | `/api/materials/{id}/rate?score=` | auth | |
| POST | `/api/materials/{id}/summarize?regenerate=` | auth, material must be `APPROVED`; `regenerate=true` restricted to uploader/admin | AI summary |
| GET | `/api/admin/materials/pending` | ROLE_ADMIN | |
| PUT | `/api/admin/materials/{id}/status?status=` | ROLE_ADMIN | |

**Does not exist on the backend, at all:**
- Comments (`GET`/`POST /api/materials/{id}/comments`)
- Admin user list (`GET /api/auth/users`)
- Any profile-update endpoint (a `UserService`/`UserProfileDTO`/`UpdateProfileRequest` exist in the backend source, but **no controller wires them up** — so there is no `/api/users/...` route to call yet)
- Notifications (no backend concept of notifications exists)
- Search filters beyond `keyword`/`semester`/`category` — no `department`, `fileType`, `rating`, `sortBy`, or pagination params on the backend

The frontend currently calls three of these non-existent endpoints as if they were real (comments, admin users, and speculative search filters). That's not a design problem, it's a contract problem — covered in §3.

---

## 2. Current frontend state (audit findings)

Full file-by-file audit available on request; the load-bearing problems:

1. **Two design systems coexist and fight each other.** A legacy plain-CSS system (`index.css`: `.btn`, `.card`, `.material-card`, CSS variables, purple `#6c63ff` accent) is still live, while every newly-rebuilt page uses Tailwind with a different accent (indigo `#4f46e5`-ish). `MaterialCard.jsx` and the old `components/Navbar.jsx` are the only holdouts still on the legacy system — and `MaterialCard` is embedded on nearly every page, so a legacy-styled card sits inside a Tailwind-styled page everywhere it's used.
2. **Two toast libraries installed, only one mounted.** `react-hot-toast`'s `<Toaster/>` is the only one rendered (`main.jsx`). `MaterialCard.jsx` and the dead old `Navbar.jsx` call `react-toastify`'s `toast` instead — so every download/delete/rating toast fired from a material card is **silently invisible** right now.
3. **Dark mode is fully disconnected.** `ThemeContext` toggles a `.light-theme` class for the legacy CSS variables; Tailwind's `dark:` variant needs `darkMode: 'class'` in `tailwind.config.cjs` (currently unset, defaults to OS-level `media`). The only component that ever called `useTheme()` was the dead old navbar. Net effect: the visible theme toggle in the app today does nothing.
4. **Two dead-code forks**: `components/Navbar.jsx` + `components/ProtectedRoute.jsx` (both superseded, both unused, confirmed via repo-wide grep) should be deleted, not designed around.
5. **`LandingPage.jsx` is fully built and API-wired but unreachable** — no route in `AppRoutes.jsx` renders it; `/` redirects straight to `/dashboard`.
6. **Inconsistent radius scale** — legacy CSS defines a 4-step scale (8/12/16/24px) but Tailwind pages freely mix `rounded-2xl` / `rounded-3xl` / `rounded-full` / arbitrary values (`rounded-[1.25rem]`, `[1.5rem]`, `[1.75rem]`, `[2rem]`) with no shared token.
7. **Several stubbed/dead controls presented as real**: Profile's "Edit Profile"/"Change Password" buttons only toast "coming soon"; Admin's "Suspend/Activate user" is a hardcoded no-op; MaterialDetail's "Bookmark" button has no handler at all; its "Rate" quick-action just resets local state instead of opening the real rating widget already sitting below it.
8. **Admin's fake-data fallback is a data-integrity risk**: when `GET /api/auth/users` fails (which it always will — the endpoint doesn't exist), `AdminDashboard.jsx` silently substitutes two hardcoded fake users with no visible error, so an admin could mistake fabricated data for real accounts.
9. **Accessibility gaps concentrated in `MaterialCard.jsx`**: its star-rating control is bare SVGs with click handlers, not `<button>` elements — not keyboard-operable, no `aria-label` (contrast with `MaterialDetailPage`'s own rating widget, which does this correctly).
10. **Two never-adopted layout wrappers** (`layouts/DashboardLayout.jsx`, `layouts/AdminLayout.jsx`) and one never-adopted shared state-UI kit (`components/ui/StatePanel.jsx`) exist as scaffolding but every page reimplements its own loading/empty/error UI inline instead.

---

## 3. Decisions needed on contract mismatches

Before visual redesign, each of these needs a call:

| Frontend feature | Backend reality | Proposed handling |
|---|---|---|
| Comments on Material Detail | No backend at all | **Remove from this redesign pass.** Ship the page without a comments section; comments becomes a separate backend+frontend feature request if wanted. |
| Admin → all users list | No backend at all | **Remove the fake-fallback silently-fabricated data.** Either drop the "Users" tab from Admin for now, or show a real empty/"not available yet" state — no invented users. |
| Search filters (`department`, `fileType`, `rating`, `sortBy`, pagination) | Not implemented server-side | **Trim SearchPage's filter UI down to what the backend supports** (`keyword`, `semester`, `category`). Fake client-side pagination (`materials.length > 8` slicing) gets removed too — it's currently broken. |
| Profile edit / change password | Service exists, no controller | **Leave the buttons as explicit "coming soon" states** (already true today) — don't design a UI for an endpoint that isn't callable yet. Flag to you separately if you want the backend controller added. |
| Notifications | No backend concept | **Keep as a clearly-labeled local/on-device feature.** UI copy makes explicit that these are generated on this device, not synced from a server (decided, §7). |

---

## 4. AI Summary — current implementation problems (rebuild, not polish)

Per your direction, here's concretely what's wrong with the existing `MaterialDetailPage.jsx` summary block before I redesign it:

1. **No status gating.** Backend restricts summarization to `APPROVED` materials only, but the frontend shows the "Generate summary" button unconditionally — clicking it on a pending/rejected material just produces a generic toast, not an explanation.
2. **No regenerate affordance at all.** The backend supports `?regenerate=true` for the uploader/admin, but the frontend only ever calls the endpoint with no params — there's no way to request a fresh summary once one exists, and no ownership check to decide who should even see that option.
3. **Errors are swallowed to one generic toast.** The backend returns a specific `{"error": "..."}` message (e.g. missing Gemini key, extraction failure, not-approved) but the UI always shows "Unable to generate summary right now" regardless of cause.
4. **No AI-content signposting.** The card is styled identically to "Comments" — no icon, label, or disclaimer marking it as AI-generated content that should be verified, which matters for trust on a summarization feature specifically.
5. **No staleness indicator.** The DTO includes `aiSummaryGeneratedAt`, but it's never shown — a user can't tell if a cached summary is from today or three months ago.
6. **No double-submit protection on the button itself** (text changes to "Generating…" but the button isn't `disabled`, unlike the comment-post button elsewhere on the same page).
7. **Generic skeleton**, indistinguishable from every other loading skeleton on the page — doesn't communicate "AI is processing" as a distinct kind of wait.

**Proposed rebuilt AI Summary block** (pending your approval, not started):
- States explicitly modeled: *not eligible (not approved yet)* → *no summary yet* → *generating* → *ready* (with generated-at timestamp + regenerate option gated to uploader/admin) → *error* (shows the actual backend message + retry).
- A small "AI-generated — verify before relying on it" caption, a distinct icon (e.g. `Sparkles` from lucide-react), and its own skeleton treatment distinct from the comments/related-materials skeletons.
- Regenerate as a secondary, clearly-labeled action (not the same button as first-generate) so it doesn't read as a free/instant re-click.

I will not touch `AiSummaryService`/`GeminiSummaryService` or write any of this until you separately confirm scope — this section is a proposal to review, not a build in progress.

---

## 5. Design system

Keeping what already works rather than introducing a third brand color: the app has *already* converged on an indigo accent across every rebuilt Tailwind page, and Inter is *already* loaded and used everywhere (`index.css` line 5). The redesign consolidates onto that, rather than inventing a new palette wholesale.

### Color tokens (light + dark, defined once as CSS variables consumed by Tailwind via `theme.extend.colors`)

| Role | Light | Dark | Usage |
|---|---|---|---|
| `brand` | `#4F46E5` (indigo-600) | `#818CF8` (indigo-400) | primary actions, links, focus ring |
| `brand-hover` | `#4338CA` | `#6366F1` | hover state |
| `surface` | `#FFFFFF` | `#0F1117` | page background |
| `surface-raised` | `#F8FAFC` (slate-50) | `#161923` | cards |
| `border` | `#E2E8F0` (slate-200) | `#252D3D` | dividers, card borders |
| `text-primary` | `#0F172A` (slate-900) | `#F1F5F9` | headings, body |
| `text-secondary` | `#475569` (slate-600) | `#94A3B8` | metadata, captions |
| `success` | `#059669` | `#34D399` | approved status, success toasts |
| `warning` | `#D97706` | `#FBBF24` | pending status |
| `danger` | `#DC2626` | `#F87171` | rejected status, destructive actions |
| `ai-accent` | `#7C3AED` (violet-600) | `#A78BFA` | reserved exclusively for AI-summary UI, so AI content is visually distinct from the brand indigo used everywhere else |

This retires the legacy purple `#6c63ff` variable set entirely — one accent color system, not two.

### Typography
- **Body/UI:** Inter (already loaded) — keep it, it's legible at small sizes and this is a dense, form-heavy utility product, not a marketing site that needs a display face.
- **Headings:** Inter at heavier weights (600/700) rather than importing a second family — a study tool should read as *credible and fast*, not decorative. One family, disciplined weight/size scale, is the more defensible choice than adding a serif or display font nobody asked for.
- **Type scale:** 12 / 14 / 16 / 18 / 24 / 32 / 40px, consistent across all pages (replaces today's ad hoc mix of `text-lg`/`text-xl`/`text-3xl` chosen per-page with no shared rationale).

### Spacing & radius
- **Spacing:** strict 4px-based scale (Tailwind defaults: 1,2,3,4,6,8,12,16) — no arbitrary padding values.
- **Radius tokens:** collapse today's 9+ arbitrary values into three: `rounded-lg` (8px, inputs/buttons), `rounded-2xl` (16px, cards), `rounded-3xl` (24px, hero/page-level containers). No more `rounded-[1.25rem]`-style arbitrary values.

### Dark mode
- Set `darkMode: 'class'` in `tailwind.config.cjs`.
- `ThemeContext` toggles a `dark` class on `<html>` (replacing today's `.light-theme` scheme, which only the legacy CSS understands).
- Every page gets `dark:` variants driven by the token table above — restoring the theme toggle to actually work everywhere, not just on the one dead component that used to read it.

### Signature element
One distinguishing visual idea, used sparingly: a **violet "AI" accent reserved only for AI-generated content** (the summary card border/icon/label). Nowhere else in the app uses that color. It gives the AI feature a consistent, recognizable visual signature without theming the whole app around it — appropriate for a feature that should read as "assistive," not as the app's core identity.

---

## 6. Page-by-page plan

| Page | Plan |
|---|---|
| Navbar / Sidebar / Footer | Rebuild on token system; wire dark-mode toggle correctly; fix Sidebar's dead `\|\| true` filter so the Admin link only shows for admins; add outside-click close to the profile dropdown |
| LandingPage | Wire into routing as the public `/` page (decided, §7); move the authenticated redirect to `/dashboard` down to a post-login destination instead of the root path |
| Login / Register | Token/style alignment only — these are already solid (validation, loading, a11y); remove the dead "Remember me" checkbox or wire it up |
| Dashboard | Restyle on tokens; clearly label the "recent activity" feed as derived-from-your-materials rather than presenting it as a live activity stream it isn't |
| Search | Trim filters to backend-supported params only (§3); remove the broken fake pagination; restyle |
| Material Detail | Restyle; remove comments section (§3); rebuild AI summary (§4, pending your go-ahead); wire or remove the dead Bookmark/Rate quick-action buttons |
| Upload | Restyle; fix the `accept` attribute vs. `ALLOWED_TYPES` mismatch (`.txt` allowed by validator, not offered by file picker); fix the dead `invalidateQueries(['materials'])` key so uploads actually refresh other lists |
| Profile | Restyle; keep Edit Profile/Change Password as clearly-labeled disabled/"coming soon" (§3) |
| Notifications | Restyle; add explicit "generated on this device" framing to the copy (decided, §7) |
| Admin | Restyle inline header directly (no wrapper adoption, §7); remove the fake-user fallback (§3); remove/replace the no-op Suspend button with an honest disabled state |
| Global cleanup | Delete `components/Navbar.jsx`, `components/ProtectedRoute.jsx`, `layouts/DashboardLayout.jsx`, `layouts/AdminLayout.jsx` (all dead/unused, decided §7); standardize on `react-hot-toast` everywhere, then remove the `react-toastify` dependency (decided, §7); delete unused legacy CSS component classes from `index.css` once nothing references them (keep only what the route-level Suspense fallback still needs, or replace that too) |

---

## 7. Decisions (resolved)

1. **LandingPage**: wire it up as the public `/` page.
2. **Notifications**: keep as a clearly-labeled local/device-only feature (make the "this is local to your device" framing explicit in the UI copy, since there's no backend behind it).
3. **`react-toastify` removal**: drop the dependency once every remaining `toast` call is migrated to `react-hot-toast`.
4. **Layout wrappers**: delete `layouts/DashboardLayout.jsx` and `layouts/AdminLayout.jsx`. Redesign the inline headers that `DashboardPage.jsx`/`AdminDashboard.jsx` already build (the ones actually in use) using the UI/UX pro-max guidance instead of resurrecting the unused wrappers.

---

## 8. Explicitly not in scope for this pass
- Any backend changes (no controllers, services, or endpoints added/modified)
- The AI summary rebuild in §4 — proposal only, needs your separate confirmation before any code is touched
- Comments feature, admin user management, notifications backend — all require new backend endpoints first, tracked as future work, not part of this visual redesign
