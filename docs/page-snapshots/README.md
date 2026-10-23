# Rover page snapshots

`2026-10-22-rover-before-controls-focus.astro` preserves the complete page before the autonomy/controls-focused edit, including Drive Motor Sizing, the state-machine image, and Arm & Lift Actuation.

To restore it, replace `src/pages/projects/autonomous-rover.astro` with this snapshot. Its imports are relative to that original location. Rebuild the site afterward. Supporting media and the ROS architecture component were retained in place.

This folder is outside `src/pages` and is not published as an additional website page.
