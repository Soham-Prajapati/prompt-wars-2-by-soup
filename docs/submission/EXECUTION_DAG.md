# Submission 2 Execution DAG

## Objective

Raise evaluation from `92.59%` to `>95%` by improving:
- `Code Quality` (86.25 -> 93+)
- `Google Services` (75 -> 90+)
- `Accessibility` (92.5 -> 96+)

## Critical Flows

### Flow A: Product Hardening
`A1 review audit -> A2 code fixes -> (A3 tests, A4 accessibility) -> A5 regression review`

### Flow B: Google Services Score Lift
`B1 integration proof matrix -> B2 implementation -> B3 visible UI proof -> B4 evidence pack -> B5 live verification`

### Flow C: Submission Packaging
`C1 technical story map -> C2 LinkedIn narrative -> C3 live preview hardening -> C4 final dry run -> C5 submission freeze`

## Ownership

- `architect/cto`: integration proof matrix, API contract, scope lock
- `dev`: implementation and bug fixing
- `design`: UX polish + accessibility states
- `review`: adversarial checks, defect prioritization
- `qa`: smoke/e2e test pass
- `devops`: preview reliability and rollback path
- `writer`: README + judge docs + LinkedIn narrative

## Gates

- `G1` (24h): no P0 regressions, integration code wired
- `G2` (48h): core tests pass, accessibility baseline done, evidence draft done
- `G3` (pre-submit): stable live preview + scripted demo + docs complete
