# Portfolio copy review

October 22, 2026. Reviewed all 14 page sources, shared components, and configuration with the Humanizer skill. The requested Hexapod deletion is applied. Suggestions below are not yet applied.

## Priorities

1. Shorten repeated explanations on Autonomous Rover. State the observed completion result and reliability limit once.
2. Trim defensive wording on Tripteron while retaining the assumptions needed to interpret its workspace and hardware results.
3. Remove internal publishing and demo-preparation notes from archived app pages.
4. Reconcile the AFP backup page with the current AFP page before changing its technical claims. Both are published routes.

## Page review

| Page | Assessment and proposed change |
| --- | --- |
| Home | About already explains the work and interests clearly. Keep it. Make the AFP summary explicitly about simulation. Simplify the Motorcycle card to "Maintained and modified my Suzuki SV650, including valve inspections, a coolant flush, an exhaust upgrade, and oil changes." |
| Hexapod | Requested stale paragraph removed. Keep the 100 Hz command rate, feedback, and fault-handling details. Hardware and simulation captions identify the media without a defensive paragraph. |
| Tripteron | Strong technical substance, but some endings sound like a review memo. Shorten "This is local geometric path optimization; it does not claim a globally optimal or jerk-limited trajectory" to "The planner performs local geometric path optimization." Keep collision exclusions and the distinction between reconstructed position and independent measurement. |
| Autonomous Rover | Most in need of shortening. Completion reliability appears in several sections. Consolidate to "Successful full-course runs took under five minutes when camera input operated smoothly. Completion was inconsistent, and the success rate was not measured." Keep the actual failure mechanisms and controller details. |
| Robotic Arm for AFP | Remove repeated explanations of contact stability. Replace "rather than pure position tracking" with a direct description of bounded forces and damped recovery. Change the proposed goal "eliminate transition spikes" to "reduce transition spikes." |
| AFP backup | This is a second published project page. Its statement that full-trajectory tracking was incomplete conflicts with the current page. Recommend keeping only one public account once the result is confirmed; retain the backup outside the published routes. No deletion or claim reconciliation performed. |
| Knowledge Editing | Keep the quantitative results and method-specific distinctions. Replace "The strongest result was also the most useful warning" with the result itself. Rename "Novel Eval" to "Custom evaluation." Clarify that locality checks test preservation of unrelated facts, not propagation of edits. |
| MapLaser | Mostly specific and natural. Keep the fabrication decisions. Tighten generic warnings such as "Automated checks do not establish part strength" to "Geometry checks do not measure part strength." |
| Motorcycle | No substantial rewrite needed. Concrete tasks and service-manual use are effective. |
| Japanese Pagoda | No substantial rewrite needed. Materials, joinery, and engraving explain the work directly. |
| Cookbook (archived) | Cut internal notes about credentials, public-source preparation, and a future demo collection. Keep capabilities and "The source and live cookbook are private." |
| Movement Library (archived) | Replace "private-first" with "private." Keep the controlled vocabulary and classification details. Remove internal demo-preparation notes. |
| Project Archive | No page-specific changes needed. |
| Art Portfolio | No copy changes needed. |

## Specific rewrites to consider

- Rover image explanation: "The vision pipeline estimates the line's lateral position relative to the image center and uses that error for steering."
- Knowledge Editing result: "High rewrite accuracy did not guarantee logically consistent follow-up answers."
- Knowledge Editing introduction: "I tested factual rewrite success, paraphrase consistency, preservation of unrelated facts, multi-hop reasoning, ripple effects, and logical consistency."
- Cookbook introduction: "A personal recipe library for saving and organizing recipes, adjusting servings, and planning meals."

Navigation, technology tags, experience, education, and the footer do not need stylistic rewrites. Keep technical scope where it changes a result's meaning; remove repeated caveats and commentary about how the portfolio was assembled. Do not replace unmeasured results with implied success.
