# Measured command pacing comparison

Figure: `public/media/hexapod/command-pacing-before-after.png` on slide 19.

## Inputs

Both recordings are individual-leg, three-motor, full-workspace tests at nominal 50 Hz on can0. The figure selects motor 31 (leg 3 hip yaw) once per command cycle, avoiding the misleading near-zero spacing between different motors in the same batch.

- Before: `individual-leg-rom-2026-08-24/20260825T032307Z_synchronized-bus-motion_motors-31-32-33_leg3-isolated-full-workspace-50hz-rawcan/commands.csv` and `events.csv`.
- After: `post-buffer-fix-all-legs-2026-08-24/tocatl-post-buffer-fix-all-legs-repeat-20260825T0425Z.tar.gz`, member directory `20260825T042624Z_synchronized-bus-motion_motors-31-32-33_leg3-full-workspace-post-buffer-fix-repeat`, files `commands.csv` and `events.csv`.
- Original records remain in the shared TOCATL Spiderbot `05_Testing + Media` folder. Raw logs are not published.
- Fix: private controller repository commit `f92465ca4fad07b269e82ded1a16191849390483`, August 24, 2026 PDT. `_next_paced_tick` discards an overdue schedule and waits a full period before continuing. The same commit also introduced transport retry/backoff handling; these tests are not a single-variable isolation of pacing versus retries.

## Method and results

Compute consecutive differences of `commands.csv` `monotonic_s` for motor 31, multiplied by 1,000. Locate each run's largest interval and show the next 47 intervals. The largest gaps are annotated, not included in the vertical range. The horizontal axis is command-cycle count, not elapsed time. These are logged host command-cycle timestamps, not physical CAN transmission timestamps.

- Before gap: 777.596074 ms. The next 39 intervals are 0.730076-1.516393 ms, followed by a return toward the nominal 20 ms cadence. `events.csv` subsequently records `Transmit buffer full` stop failures and a transport-related run failure.
- After gap: 780.291838 ms. The plotted 47 intervals are 18.040106-20.131245 ms. No `Transmit buffer full` event occurs in this run.
- The pre-fix run recovered motor 33 temporarily; the post-fix run's motor 33 recovery expired and the responding motors returned. Thus the figure compares pacing around two similar recovery gaps, not identical recovery outcomes or repeated identical disturbances.
- No smoothing, resampling, simulated values, fitted time alignment, or wire-rate inference. The plot does not claim that feedback dropout was fixed.
- The post-fix summary reports no transmit-buffer failures during motion/recovery in either sequential test set, while motor-local reply losses remained. An initial telemetry scan encountered an old full queue before an interface reset; the claim deliberately excludes that preflight event.

## Source hashes (SHA-256)

| File | SHA-256 |
| --- | --- |
| Before commands | `0f65b0f6436ce8b3f320dfda104c468747525d62420946b478aa29372d100495` |
| After commands | `23363b41ac6e1df0325e8b54a7c3f2baebb4adda64c2e0e99c30e2575a641718` |
| Before events | `8636e4477b74a2b1426c8b0c7d2dd753368710cc6d8d4328babf4b77e45cbe1a` |
| After events | `e53b991700bb0a4eaf3d5defebdb37388ce9020754aef4afff12c6c5666f1af1` |
