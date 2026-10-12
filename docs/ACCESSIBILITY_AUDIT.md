# KindDoor Comprehensive Accessibility (A11y) Audit
**Target Standard: WCAG 2.2 Level AA**

---

## 1. Executive Summary
KindDoor was engineered from the ground up as an accessibility-first application. This audit evaluates the four primary user accommodation journeys against WCAG 2.2 AA standards:
1. **Blind / Low-Vision Residents** (Voice-first, audio replay, keyboard accessibility, ARIA live regions).
2. **Deaf / Hard-of-Hearing Residents** (Visual-first alerts, real-time live captions, color-coded badges, zero audio requirements).
3. **Older Adults & Cognitive Care** (Patient repetition, 2-choice max decisions, calm pacing, silence $\neq$ consent).
4. **Motor / Hands-Full Residents** (Hands-free credential entry, large click targets, keyboard shortcuts).

---

## 2. WCAG 2.2 AA Compliance Matrix

| Principle | Guideline | Verification | Status |
| :--- | :--- | :--- | :---: |
| **1. Perceivable** | **1.1 Text Alternatives** | All icons and visual badges feature semantic labels and `aria-label` tags. | **PASS** |
| | **1.2 Time-based Media** | Browser Web Speech API syncs with visible high-contrast caption boxes. | **PASS** |
| | **1.3 Adaptable** | Content reflows seamlessly across viewport widths from mobile (320px) to desktop (4K). | **PASS** |
| | **1.4 Distinguishable** | High-contrast palette (`#0F172A` background with `#F8FAFC` and `#F59E0B` text) exceeds 7:1 contrast ratio. | **PASS** |
| **2. Operable** | **2.1 Keyboard Accessible** | Full keyboard navigation: `[Tab]` focus rings, `[Space]` audio replay, `[1]` / `[2]` simplified choice selection. | **PASS** |
| | **2.2 Enough Time** | No expiring timeout will ever auto-unlock the door or dismiss essential security dialogues without interaction. | **PASS** |
| | **2.3 Seizures & Physical** | Animations respect `prefers-reduced-motion: reduce`; pulsing effects are soft and sub-3Hz. | **PASS** |
| | **2.4 Navigable** | Skip links, clear heading hierarchy (`h1` -> `h2` -> `h3`), and descriptive document titles on every view. | **PASS** |
| **3. Understandable** | **3.1 Readable** | Patient mode strips technical jargon into simple, calm everyday language. | **PASS** |
| | **3.2 Predictable** | Mode switching preserves state without unexpected context jumps or unprompted actions. | **PASS** |
| | **3.3 Input Assistance** | Error states provide clear textual explanations and recovery recommendations. | **PASS** |
| **4. Robust** | **4.1 Compatible** | Valid semantic HTML5 elements (`<header>`, `<nav>`, `<main>`, `<button>`, `<role="status">`). | **PASS** |

---

## 3. Dedicated User Journey Evaluations

### 3.1. Blind / Low-Vision Profile (`BLIND_LOW_VISION`)
- **Speech Synthesis**: Browser `window.speechSynthesis` speaks visitor descriptions and options automatically.
- **Audio Replay Hotkey**: Hitting `[Spacebar]` immediately repeats the last announcement without requiring mouse navigation.
- **ARIA Live Regions**: Dialogue updates are wrapped in `role="alert"` and `aria-live="assertive"`.

### 3.2. Deaf / Hard-of-Hearing Profile (`DEAF_HARD_OF_HEARING`)
- **Visual Alert Banner**: Flashing amber perimeter border and prominent alert card appear on doorbell ding.
- **Real-Time Captions**: Stated visitor claims and questions are rendered in bold, high-contrast text.
- **Touch / Click Palette**: Clear, large action buttons (`[Leave on Porch]`, `[Admit]`, `[Decline]`).

### 3.3. Patient / Older Adult Profile (`PATIENT_SIMPLIFIED`)
- **Cognitive Simplification**: When confusion is detected (*"I don't understand"*), the system reduces options to 2 binary buttons (Option 1 / Option 2).
- **Silence $\neq$ Consent**: If the resident does not respond, the door remains strictly locked.

---

## 4. Mobile & Responsive Layout Audit
- Tested on standard mobile viewport sizes (375x667, 390x844, 412x915).
- Click targets exceed the minimum 44x44 CSS pixel requirement.
- Navigation bar collapses cleanly with horizontal overflow scrolling for mode switchers and tabs.
