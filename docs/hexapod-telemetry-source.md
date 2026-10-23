# Hexapod presentation telemetry

- Recording: `spider-art-showcase-v2-2026-08-24/20260825T025558Z_synchronized-bus-motion_motors-21-22-23-31-32-33-41-42-43_recognition-smooth-cubic-3cycles-100hz` in TOCATL Spiderbot's Testing + Media folder.
- Inputs: `commands.csv`, `telemetry.csv`, and `events.csv`. Original records remain in the project media folder; no raw logs are published.
- Figure: `/media/hexapod/recognition-tracking.png`. Command `motor_position_rad` and fresh telemetry `position_rad` for motor 22; both are raw motor radians. Time is the recorded Unix timestamp minus the first command timestamp, without fitted alignment or resampling.
- The lower panel shows `data_age_s` for all nine motors on can0. This CSV has 10,503 rows, all marked fresh. That does not establish health on can1.
- At 7.1687 seconds, `peer_return_requested` reports stale/missing telemetry on can1 and `graceful_zero_return_started` begins a 4.5-second return. `graceful_zero_return_complete` is followed by a latched hold. The plotted record lasts 11.6605 seconds; it is an interrupted run, not three completed cycles.
- The existing load and thermal/voltage figures are from a separate 15-motor run. They are not evidence of the scheduler-pacing fix.

## Motion and motor load

- Figure: `/media/hexapod/motion-and-load.png`, replacing the aggregate load and thermal/voltage figures in the presentation. Original exports remain available in the media folder.
- Source: both `20260825T010505Z_synchronized-bus-motion_*_shadow-dialogue-smooth-cubic-1cycles-100hz` runs under `shadow-dialogue-amplitude-sweep-2026-08-24/raw/`. The two buses record 15 motors in total; this figure shows only motor 22 (displayed as 2-2).
- Upper panel: `commands.csv` motor_position_rad and fresh `telemetry.csv` position_rad, in raw motor coordinates. Lower panel: the same motor's reported iq_filtered_current_a. This is motor q-axis current, not battery current or a direct load-cell measurement.
- Both panels use recorded timestamps relative to the first motor-22 command, without fitted delay, resampling, or additional filtering. All motor-22 feedback rows in this run are marked fresh. The recognition-motion fault plot above is a different test.
