# Content source and review register

**Product:** „გზის ლოგიკა“ (Road Logic), chapter 1, „ვინ გადის პირველი?“ (unregulated intersection)
**Primary source:** საქართველოს კანონი „საგზაო მოძრაობის შესახებ“ — https://matsne.gov.ge/ka/document/view/2169396
**Version consulted:** consolidated version on matsne.gov.ge (latest consolidated publication listed: 25/06/2026)
**Date checked:** 2026-10-17
**Superseded law not used:** „საგზაო მოძრაობის უსაფრთხოების შესახებ“

The machine-readable register lives in [`src/content/rules.ts`](../src/content/rules.ts) (`SOURCE_REGISTER`, `RULES`). It is also shown in the app under **წყაროები**.

## Review statuses

| Status | Meaning | Who can set it |
|---|---|---|
| `draft` | Written, not yet compared with the source | author |
| `source_checked` | Compared with the official consolidated text | author |
| `instructor_reviewed` | Reviewed by a qualified driving instructor | **only a real qualified human reviewer** |

No content currently has `instructor_reviewed`, and a test fails if any scenario claims it.

## How the check was done

The page was downloaded from matsne.gov.ge and the text of Article 36 was extracted verbatim. The official wording of 36(4)(ა–დ) is stored in `RULES[*].officialTextKa` and shown in each „წესის წყარო“ panel. Each paraphrase below was compared with that text. Related provisions used in lesson wording are Art. 5(37) (definition of main road) and Art. 36(8) (if road status cannot be determined and there are no priority signs, the driver is treated as being on a secondary road).

The check was done by the developer (an AI coding assistant), not by a lawyer or instructor.

## Rules

| Rule ID | Article / paragraph | Source URL | Date checked | Paraphrase (Georgian, as shown in the app) | Status |
|---|---|---|---|---|---|
| `R36-4a` | მუხლი 36, პ. 4(ა) | matsne.gov.ge/ka/document/view/2169396 | 2026-10-17 | თუ გზაჯვარედინზე ერთი გზა მთავარია, მეორეხარისხოვან გზაზე მყოფი მძღოლი გზას უთმობს მთავარი გზიდან მომავალ ავტომობილს — სულ ერთია, საით აპირებს ის შემდეგ მოძრაობას და რომელი მხრიდან მოდის. | source_checked |
| `R36-4b` | მუხლი 36, პ. 4(ბ) | same | 2026-10-17 | თუ მთავარი გზა გზაჯვარედინზე უხვევს, მთავარ გზაზე მყოფი მძღოლები ერთმანეთს შორის თანაბარმნიშვნელოვანი გზების წესებს იცავენ. ასევე იქცევიან ერთმანეთს შორის მეორეხარისხოვან გზებზე მყოფი მძღოლებიც. | source_checked |
| `R36-4c` | მუხლი 36, პ. 4(გ) | same | 2026-10-17 | თანაბარმნიშვნელოვანი გზების გადაკვეთაზე გზას უთმობ იმ ავტომობილს, რომელიც შენგან მარჯვნიდან გიახლოვდება. „მარჯვნივ“ ნიშნავს მძღოლის მარჯვნივ… რელსიან სატრანსპორტო საშუალებას ასეთ გზაჯვარედინზე უპირატესობა აქვს მიმართულების მიუხედავად. | source_checked |
| `R36-4d` | მუხლი 36, პ. 4(დ) | same | 2026-10-17 | მარცხნივ მოხვევისას ან მობრუნებისას გზას უთმობ თანაბარმნიშვნელოვან გზაზე საპირისპირო მიმართულებიდან მომავალ ავტომობილს, რომელიც პირდაპირ მიდის ან მარჯვნივ უხვევს. | source_checked |

## Scenarios

All scenarios are original. None is copied from official exam questions or illustrations. Every scenario has two passenger cars, right-hand traffic, an explicitly stated route for each vehicle, and paths that cross or merge.

| ID | Mode | Rule | Layout (learner = A) | Answer | Status |
|---|---|---|---|---|---|
| ch1-L1-main-secondary | lesson | 4(ა) | Main road E–W. A: S→straight (secondary). B: W→straight (main, on A's **left**) | B | source_checked |
| ch1-L2-equal-right | lesson | 4(გ) | Equal. A: W→straight. B: S→straight (A's right) | B | source_checked |
| ch1-L3-left-oncoming | lesson | 4(დ) | Equal. A: E→left. B: W→straight (oncoming) | B | source_checked |
| ch1-L4-main-bends | lesson | 4(ბ)+(გ) | Main N↔E. A: N→straight. B: E→straight. A is on B's right | A | source_checked |
| ch1-G1-main-road | guided | 4(ა) | Seed C. Main N–S. A: S→straight (main). B: E→straight (secondary, on A's **right**) | A | source_checked |
| ch1-G2-equal-right | guided | 4(გ) | Seed A. Equal. A: S→straight. B: E→straight (A's right) | B | source_checked |
| ch1-G3-left-turn | guided | 4(დ) | Seed B. Equal. A: S→left (to W). B: N→straight | B | source_checked |
| ch1-G4-main-bends | guided | 4(ბ)+(გ) | Seed D. Main S↔E. A: S→straight. B: E→straight. Both leave the main road | B | source_checked |
| ch1-T1-secondary-right-turn | independent | 4(ა) | Main N–S. A: E→right (secondary). B: S→straight (main, A's left). Paths merge | B | source_checked |
| ch1-T2-equal-right-rotated | independent | 4(გ) | Equal. A: N→straight (closer). B: W→straight. Driver-right = screen-left | B | source_checked |
| ch1-T3-left-vs-oncoming-right | independent | 4(დ) | Equal. A: W→left (to N). B: E→right (to N). Paths merge | B | source_checked |
| ch1-T4-main-bends-left | independent | 4(ბ)+(გ) | Main W↔N. A: W→left (follows main). B: N→straight. B not oncoming; A on B's right | A | source_checked |
| ch1-X1-secondary-left-turn | alternate | 4(ა) | Main E–W. A: N→left (secondary). B: E→straight (main) | B | source_checked |
| ch1-X2-equal-you-are-right | alternate | 4(გ) | Equal. A: E→right. B: S→straight. A on B's right. Paths merge | A | source_checked |
| ch1-X3-left-turn-north | alternate | 4(დ) | Equal. A: N→left (to E). B: S→straight | B | source_checked |
| ch1-X4-main-bends-west | alternate | 4(ბ)+(გ) | Main S↔W. A: W→straight. B: S→straight (A's right) | B | source_checked |

### Seed verification notes

- **Seed A** (A: S→N, B: E→W, equal): A heads north, so A's right is east. B approaches from the east and has priority (4(გ)). Paths cross. Kept.
- **Seed B** (A: S→W left turn, B: N→S straight, equal): B is oncoming, neither on A's right nor left. 4(დ) applies, so B has priority. The left-turn arc crosses B's southbound lane. Kept.
- **Seed C** (A main S→N, B secondary E→W): 4(ა) applies, so A has priority. B is on A's right, which deliberately shows that the right-hand rule does not override priority signs. Signs: 2.1 „მთავარი გზა“ on the N and S approaches, 2.3 „დაუთმე გზა“ on E and W, each on the driver's right and facing that driver. Kept.
- **Seed D** (main S↔E. A: S→N, B: E→W, both leave the main road): both approach on the main road, so 4(ბ) applies: equal-road rules between them. A heading north has east on the right, and B comes from the east, so B has priority under 4(გ). Neither turns left, so 4(დ) does not apply. The paths cross in the north-east quadrant of the junction. Direction plates were computed per approach from each driver's heading: S driver sees thick bottom + right; E driver thick bottom + left; N driver thick top + left; W driver thick top + right. Kept.

### Consistency checks in code

`src/__tests__/content.test.ts` re-derives the priority vehicle for every two-car scenario with a small rule check (4(ა) → 4(ბ)/(გ)/(დ)) and asserts that it matches the hand-authored answer. `src/__tests__/timeline.test.ts` asserts that declared conflicts actually cross or merge, that the correct replay never overlaps the cars, and that wrong-answer previews stop before the conflict zone. These tests prove internal consistency, **not legal correctness**.

## Sign annex check

**Source:** attachment *danarti 1-5.doc* of the law on matsne.gov.ge (publication 36, download `/ka/document/download/2169396/36/1`, 13,195,776 bytes), section 2 „პრიორიტეტის ნიშნები“ and section 8 (plates). **Checked:** 2026-10-17, by the developer (an AI coding assistant). The annex text gives each sign's number, name and meaning. The pictures were measured pixel by pixel.

| Catalogue no. | Official name | Annex design | Change made in `SignGraphic.tsx` |
|---|---|---|---|
| 2.1 | „მთავარი გზა“ | White diamond with a dark edge and rounded corners. Yellow inner diamond (≈ 0.59 of the outer half-diagonal) with a thin black outline. Picture yellow ≈ #ffe500. | Was amber #f2b705 at 0.66, without the black outline, with near-sharp corners. Now matches the annex. |
| 2.3 | „დაუთმე გზა“ | White equilateral triangle, point down, rounded corners. Red border ≈ 0.06 of the side, with a thin white rim and dark edge outside it. Picture red ≈ #ff0000. | The red border was ≈ 0.13 of the side (twice the annex), with no outer rim and red #c8102e. Now matches the annex. **Name corrected**: the app called it „გზის დათმობა“. |
| 8.13 | „მთავარი გზის მიმართულება“ (plate; used with 2.1, 2.3 and 2.4 when the main road changes direction) | Square white plate with rounded corners and a black border (≈ 2 % of the side). Lines lie on the plate's centre axes and reach the border. The main road is one thick band (≈ 10 % of the side) with butt ends and a rounded bend. The other roads are thin lines (≈ 3 %) that run from the border to the edge of the thick band. | Was a 30×24 plate, with lines starting at the centre and stopping short of the border, round caps, a sharp bend and a thick-to-thin ratio of ≈ 2.6. Now matches the annex. |

Not changed: the plate is still drawn from the reading driver's point of view (own approach at the bottom), which matches the annex picture and the meaning in the annex text. Sign names in `SIGN_NAME_KA` and `PLATE_NAME_KA` now carry the catalogue numbers, and lesson and scenario text uses „დაუთმე გზა“. The phrase „გზის დათმობა“ is still used where it means the act of yielding, not the sign. Scenario answers were not changed.

## Open items before public educational release

1. A qualified Georgian driving instructor must review all 16 scenarios, explanations and the Georgian wording, then update `reviewStatus`.
2. ~~Compare the sign artwork with the official sign annex.~~ **Done 2026-10-17**, see "Sign annex check" above. What remains: the annex has only small raster pictures with no dimensioned drawings or colour specifications, so the proportions are measured from those pictures (roughly ±5 %) and the colours are the picture colours. If an exact design standard is needed, compare against the national sign standard that defines dimensions and retroreflective colours, which was not consulted.
3. Re-check the consolidated text if a newer publication appears on matsne.gov.ge, and update `DATE_CHECKED` / `CONSOLIDATED_VERSION`.
