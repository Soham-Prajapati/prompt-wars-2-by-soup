# Hard Gates for Submission 2

## Gate 1: Planning Integrity
- Scope limited to 3 demo-critical flows.
- API contracts for chat, fact-check, timeline, and quiz locked.
- Every P0 task has an owner and acceptance criteria.

## Gate 2: Build Health
- Frontend production build passes.
- Backend imports and starts cleanly.
- No high-severity runtime errors in core flows.

## Gate 3: Reliability
- Chat works in both normal and fallback modes.
- Fact-check works in both normal and fallback modes.
- Timeline renders without contract mismatches.
- Quiz returns deterministic fallback when AI path fails.

## Gate 4: Accessibility
- Keyboard focus visible on all interactive controls.
- No color-only status communication in verdict/quiz states.
- Critical routes usable with keyboard only.

## Gate 5: Judge-Ready Evidence
- Google services list with live code references documented.
- Demo script (2 min + 5 min) finalized.
- Criteria-to-evidence matrix finalized.

## Gate 6: Final Submit Lock
- 3 successful dry runs back-to-back.
- No open P0/P1 defects.
- Submission docs and narrative package complete.
