# Hexapod presentation telemetry

- Recording: `spider-art-showcase-v2-2026-08-24/20260825T025558Z_synchronized-bus-motion_motors-21-22-23-31-32-33-41-42-43_recognition-smooth-cubic-3cycles-100hz` in TOCATL Spiderbot's Testing + Media folder.
- Inputs: `commands.csv`, `telemetry.csv`, and `events.csv`. Original records remain in the project media folder; no raw logs are published.
- Figure: `/media/hexapod/recognition-tracking.png`. Command `motor_position_rad` and fresh telemetry `position_rad` for motor 22; both are raw motor radians. Time is the recorded Unix timestamp minus the first command timestamp, without fitted alignment or resampling.
- The lower panel shows `data_age_s` for all nine motors on can0. This CSV has 10,503 rows, all marked fresh. That does not establish health on can1.
- At 7.1687 seconds, `peer_return_requested` reports stale/missing telemetry on can1 and `graceful_zero_return_started` begins a 4.5-second return. `graceful_zero_return_complete` is followed by a latched hold. The plotted record lasts 11.6605 seconds; it is an interrupted run, not three completed cycles.
- The existing load and thermal/voltage figures are from a separate 15-motor run. They are not evidence of the scheduler-pacing fix.
