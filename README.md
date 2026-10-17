# გზის ლოგიკა — Road Logic

An interactive browser app for learning Georgian driving theory through traffic situations. It teaches *why* a decision is correct instead of drilling answer positions.

**Learning loop:** learn a rule → observe a situation → choose → check → see the outcome → read the explanation → solve a changed situation → review results.

This MVP contains one complete chapter, **„ვინ გადის პირველი?“ — არარეგულირებული გზაჯვარედინი**, based on Article 36(4)(ა–დ) of the Law of Georgia „საგზაო მოძრაობის შესახებ“. All learner-facing text is in Georgian.

> **Content status.** The scenarios are original and were compared with the current consolidated text on matsne.gov.ge (checked 2026-10-17). They have **not** been reviewed by a qualified driving instructor. They are not official exam tickets, not approved by the Service Agency, and completing the chapter does not show readiness for the national exam. See [docs/SOURCE_REGISTER.md](docs/SOURCE_REGISTER.md).

## Commands

Requires Node.js 18+ (developed with Node 24).

```bash
npm install
```

```bash
npm run dev
```

Dev server at http://localhost:5173.

```bash
npm test
```

Runs Vitest once (unit and component tests).

```bash
npm run typecheck
```

```bash
npm run build
```

Type-checks, then writes the static site to `dist/`.

```bash
npm run preview
```

Serves `dist/` locally at http://localhost:4173.

### Static hosting

- **Build command:** `npm run build`
- **Publish directory:** `dist`

All asset paths are relative (`base: './'`) and routing uses the URL hash, so `dist/` works from any static host or sub-folder with no rewrite rules. The Georgian font (Noto Sans Georgian, SIL OFL) is bundled locally through `@fontsource`. There is no backend, account system, analytics or external request.

Nothing has been deployed or pushed anywhere.

## What's in the chapter

| Part | Content |
|---|---|
| Start | Title, one-sentence purpose, active chapter, „დაიწყე სწავლა“ / „გააგრძელე“, local-progress and content-status notices |
| Chapter overview | Learning conditions, 4 lessons, 4 guided, 4 independent, results, settings, progress reset (with confirmation) |
| 4 lessons | Main vs secondary road · equal roads / vehicle from the right · left turn vs oncoming · main road changes direction. Each has a short explanation, animated example, highlighted decisive sign or relationship, a simple question, and an expandable „წესის წყარო“ with the official wording |
| 4 guided exercises | Design seeds C, A, B, D (one per rule). Optional „გაიხსენე წესი“ hint, recorded as assistance |
| 4 independent exercises | Rotated or changed layouts, vehicles and routes. No hints and no answer-revealing colours before „შემოწმება“ |
| 4 alternate exercises | One extra hand-authored variant per rule, offered from Results as „სცადე სხვა ვარიანტი“ |
| Feedback | Calm verdict, misconception-specific explanation for every option, correct answer, decisive rule, „რატომ?“ (all options explained), rule source. Wrong answers can preview the proposed movement, which stops before the conflict; a tab switches to the correct replay |
| Playback | „პაუზა“, „გაიმეორე“, „ნაბიჯ-ნაბიჯ“ (previous/next step), numbered step captions as the text equivalent. Reduced-motion mode jumps between steps |
| Results | First-attempt independent accuracy (e.g. 3 / 4), per-rule table, guided first attempts and total attempts, assistance count, topics to revisit with lesson and alternate-exercise links |
| Mistake review | Every first-attempt mistake: your answer, correct answer, explanation, link back to the animated scene |
| Sources | In-app source and review register |

All scenarios use two passenger cars, right-hand traffic, clear visibility, no pedestrians, trams, emergency vehicles or signals, and show every vehicle's full route. Only the top-down view („ზემოდან“) is implemented. No camera toggle is shown.

## Architecture

```
src/
  content/                 data only
    types.ts               Scenario, ChapterManifest, RuleContent, register types
    rules.ts               rule text (official + paraphrase) and SOURCE_REGISTER
    chapters/ch1/          scenarios.ts (16 hand-authored scenarios), manifest.ts
    registry.ts            chapter registry + learning sequence
    validate.ts            structural validation of scenarios and chapters
  engine/                  pure logic, no React
    geometry.ts            arms, driver-relative sides, lane paths, sign placement
    evaluate.ts            answer evaluation against the authored answer
    timeline.ts            conflict analysis, collision check, correct/proposal timelines
    playback.ts            deterministic playback reducer (play/pause/step/replay)
  progress/                storage.ts (versioned localStorage + memory fallback),
                           progress.ts (attempts, statistics), ProgressContext.tsx
  render/                  Scene.tsx (top-down SVG), VehicleGraphic, SignGraphic, SignInset
  hooks/                   usePlayback (rAF / reduced-motion stepping, pause on hidden tab),
                           useReducedMotion, useRoute (hash router)
  ui/                      screens/, components/, navigation.ts, describe.ts (text equivalents)
```

Key decisions:

- **No legal inference engine.** Answers and explanations are hand-written. The engine only computes geometry, conflicts and safe animation timing.
- **Driver-relative directions.** Every approach is authored in a "south frame" and rotated. `relativeSide()` derives right/left/opposite from the driver's heading, never from screen position. Direction plates are drawn from each reading driver's viewpoint.
- **Deterministic animation.** Timelines are keyframes of distance along a path, sampled by time. The correct replay searches, in 0.1 s steps, for the earliest moment the yielding car can go with no overlap between the cars' bodies (oriented-rectangle check), then adds a comfort gap.
- **Measurement.** Every check records scenario ID, content version, rule, mode, selected option, correctness, `firstAttempt`, `assistanceUsed` and timestamp. Retries append, never overwrite. Each question presentation has a submission ID, so duplicate submissions are ignored. Replays never create attempts. Statistics use first attempts for the current content version only.
- **Storage.** Key `gzis-logika.progress`, `schemaVersion: 1`. Corrupt or unknown data is discarded with a notice; a copy of the damaged value is kept under `…​.corrupt`. If `localStorage` is unavailable or a write fails, the app keeps working in memory and says so.
- **Future driver view.** `Scene` takes `(scenario, motion, positions, reveal)`. A perspective renderer can consume the same model and playback state.

Adding a chapter: [docs/ADDING_A_CHAPTER.md](docs/ADDING_A_CHAPTER.md).

## Tests

`npm test` runs 127 tests in 6 files:

| File | Covers |
|---|---|
| `content.test.ts` | Chapter validation, unique IDs, vehicle-ID references, one correct option per scenario, a distinct non-generic explanation for each wrong option, authored answers agreeing with an independent rule cross-check, explicit equal-road status, rule coverage, no false `instructor_reviewed` claims, driver-relative fixtures (seed A, T2 screen-left = driver-right, seed C, seed D, T4, seeds B/T3) |
| `geometry.test.ts` | Right/left/opposite from heading, exit arms, direction plates, and for all 12 approach × maneuver paths: start and end in the correct right-hand lane, heading consistent at both ends, no heading flips |
| `timeline.test.ts` | For all 16 scenarios: declared conflicts actually cross or merge; the correct replay never overlaps the cars, and the yielding car enters the conflict zone only after the priority car; wrong-answer previews stop before the conflict without contact; ordered steps |
| `playback.test.ts` | Load, tick, pause/resume, reset, replay, restart at end, step forward/back, reduced-motion discrete stepping |
| `progress.test.ts` | First attempt vs retry, stored fields, duplicate submission ID, content-version change, lesson completion, results (numerator/denominator, guided separate, assistance, revisit, repeated completion ≠ mastery), save/load round trip, reload without duplicates, corrupt JSON, unknown schema, partially invalid data, storage that throws, missing storage, quota failure mid-session, reset |
| `exercise-ui.test.tsx` | Double click on „შემოწმება“ records one attempt; changing the selection before checking; assistance tracking; independent mode has no hint and no highlights before submission; retry stored separately; replay/step/pause create no attempts; reopening an answered exercise does not re-record; option-specific feedback |

These tests prove the implementation is internally consistent. They do **not** prove legal correctness.

## Verification performed (2026-10-17)

- `npm run typecheck`: passed. `npm test`: 127/127 passed. `npm run build`: succeeded (JS 239 kB, 75 kB gzipped).
- In the in-app browser (Chromium) against the dev server:
  - Full path: start → „დაიწყე სწავლა“ → 4 lessons → 4 guided → 4 independent → results → mistake review, using only in-app navigation buttons.
  - All 36 options of the 12 exercise scenarios (guided, independent, alternate) were submitted one by one. Each showed the intended verdict and its own explanation title. Retries were stored as new attempts, with exactly one first attempt per scenario.
  - Correct replays and wrong-answer previews were inspected for G4, T3 and T4: cars stay in right-hand lanes, turns end in the correct lane, cars face their direction of travel, and previews stop before the conflict marker.
  - The direction plates for T4 were read from the rendered SVG and matched the hand-computed expectation for each approach.
  - Mobile (375 × 812): scenes and labels readable, no horizontal scrolling on any screen (a long URL on the sources page was fixed during this check), no interactive target under 40 px.
  - Progress survives a reload without duplicating attempts, and an answered exercise reopens on its feedback.
  - Reset: cancel keeps data; confirm clears it.
  - Reduced motion: playback advances step by step (~1.6 s per step) with captions; continuous animation is off.
  - Production `dist/` served with `vite preview`: loads, the bundled font is active, no console errors.
- Not verified: other browser engines (Firefox, Safari), real touch devices, screen-reader output (ARIA roles and labels are in place but were not tested with a screen reader).

## Remaining content-review limitations

1. **No instructor review.** All content is `source_checked`, not `instructor_reviewed`. A qualified Georgian driving instructor must review every scenario, explanation and Georgian phrasing before public educational release.
2. **Sign artwork.** Signs 2.1 „მთავარი გზა“ and 2.3 „დაუთმე გზა“ and plate 8.13 „მთავარი გზის მიმართულება“ were compared with the law's sign annex (*danarti 1-5*) on 2026-10-17 and redrawn to match it. The app shows the official names and catalogue numbers. The annex has no dimensioned drawings, so the proportions are measured from its pictures (roughly ±5 %), and the colours are the picture colours, not a retroreflective colour specification. Details are in [docs/SOURCE_REGISTER.md](docs/SOURCE_REGISTER.md#sign-annex-check).
3. **Simplified conditions.** One lane per direction, two cars, no trams, pedestrians or signals. The rail-vehicle exception in 36(4)(გ) and U-turns in 36(4)(დ) are explained in text but not exercised in scenes.
4. **Georgian copy** was written by the developer and should be proofread by a native-speaking editor.
5. **Source freshness.** Re-check the consolidated law on matsne.gov.ge whenever a new publication appears.
