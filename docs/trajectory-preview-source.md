# Recognition trajectory preview

`public/media/hexapod/recognition-trajectories.png` is a planned-motion illustration, not recorded actuator feedback.

- Input: `config/spider-art-recognition.csv` in TOCATL, checkout `8a96b6ca35c6ba55a6f3698996078ce944bbc45d`.
- Legs 1 and 3 only; hip yaw, hip pitch, knee. Values are joint offsets in degrees from the session reference, not absolute motor angles.
- Frame durations: 1.2, 1.0, 1.4, 1.1, 1.3 seconds. Preview starts at zero and ends after the release keyframe at 6 seconds; it does not include startup alignment or the return sequence.
- Curves use `_shape_preserving_tangents` and `_sample_smooth_cubic` from `synchronized_bus_test.py`, sampled at 100 Hz. Only those pure functions were loaded; no hardware-control module was imported and no motor commands were sent.
- Hip-pitch peaks occur at 2.2 seconds (leg 1, 160 degrees) and 3.6 seconds (leg 3, 96 degrees). The 1.4-second separation describes planned timing, not measured tracking lag.
- The companion `recognition-tracking.png` remains the recorded test. Its display labels use leg-joint notation (2-2); raw motor IDs and recorded values are unchanged.
