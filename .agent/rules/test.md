---
trigger: always_on
---

# 🛡️ FINE News App - Agent Operational Protocols

This document defines the operational rules for AI agents working on the `fine-news-app`. It complements the technical constraints in `AGENTS.md`.

## Rule 0 — Quality Over Speed
- **Architecture First:** Prefer clean, scalable designs over quick hacks.
- **No Shims:** Avoid wrappers or indirection unless absolutely necessary.
- **Leave It Better:** Refactor legacy code when touching it. Future agents inherit your decisions.

## Rule 1 — Single Source of Truth (SSOT)
- **Planning & Status:** `TODO_PLAN.md` is the canonical source for active tasks and project status.
- **Technical Constraints:** `AGENTS.md` is the authority on stack, styling, and patterns.
- **Data Schema:** `fire_data.md` is the source of truth for Firestore/Storage schemas.
- **Operations:** `adime_guide.md` governs administrative workflows.

## Rule 2 — Agent Identity & Logging
- **Identity:** Every conversation/session acts as a distinct "Agent".
- **Log File:** Create/Update a log file in `.gemini/agent_logs/AGENT_<ID>_<SUMMARY>.md` (or `.teams/` if preferred) to track high-level reasoning.
- **Code Comments:** Use `// AGENT_<ID>: Reason` for complex changes to ensure traceability.

## Rule 3 — Pre-Work Checklist
Before writing code, every agent must:
1.  Read `AGENTS.md` (Technical Rules).
2.  Read `TODO_PLAN.md` (Current Phase).
3.  Read `fire_data.md` (If touching data).
4.  Check `package.json` for available scripts.
5.  **Verify Build:** Ensure `npm run ios` (or relevant platform) builds before starting.

## Rule 4 — Regression Protection
- **Baseline:** The app must build and run without crashing.
- **Verification:** Since automated tests are limited, you **MUST** manually verify changes:
    -   **UI Changes:** Verify on iOS Simulator.
    -   **Logic Changes:** Verify via console logs or UI behavior.
-   **Never break the build:** If `npm run ios` fails, you must fix it immediately.

## Rule 5 — Breaking Changes
- **Favor Clean Breaks:** If a component is deprecated, remove it or rename it clearly. Do not leave "zombie" code.
- **Schema Changes:** If you modify Firestore schema, you **MUST** update `fire_data.md` immediately.

## Rule 6 — No Dead Code
- Remove unused imports, variables, and commented-out blocks.
- The codebase should only contain active, working code.

## Rule 7 — Modular Refactoring
- **File Size:** Keep files under 300 lines where possible. Split large components (e.g., `NewsCard.js`) into sub-components if they grow too complex.
- **Colocation:** Keep related styles and logic close to the component.

## Rule 8 — Ask Questions
- If requirements in `TODO_PLAN.md` are ambiguous, create a question file in `.gemini/questions/` (or `.questions/`) and ask the user.
- **Never guess** on data schema or security rules.

## Rule 9 — Context Management
- **Batch Work:** Complete related tasks in one session to minimize context switching.
- **Update Status:** Keep `task.md` (if used) and `TODO_PLAN.md` updated.

## Rule 10 — Definition of Done
A task is ONLY done when:
1.  [ ] The code compiles (`npm run ios`).
2.  [ ] The feature works as described.
3.  [ ] `fire_data.md` is updated (if schema changed).
4.  [ ] `TODO_PLAN.md` is updated.
5.  [ ] Handoff notes are written in the Agent Log.

## Rule 11 — TODO Tracking
- **In Code:** `// TODO(AGENT_<ID>): description`
- **Global:** Add major pending items to `TODO_PLAN.md`.

## Rule 12 — Quick Reference
| Concept | Location |
| :--- | :--- |
| **Plan SSOT** | `TODO_PLAN.md` |
| **Tech SSOT** | `AGENTS.md` |
| **Data SSOT** | `fire_data.md` |
| **Agent Logs** | `.gemini/agent_logs/` |
| **Questions** | `.gemini/questions/` |
