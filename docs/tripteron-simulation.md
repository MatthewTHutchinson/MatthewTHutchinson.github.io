# Tripteron CAD Motion

The standalone scene lives at `/projects/tripteron/simulation/` and is embedded in
the Tripteron project presentation. Three.js renders actual STEP solids, grouped
into the fixed assembly, platform, three carriages and eight links.

## Motion Data

`public/media/tripteron/simulation/manifest.json` records the source hash, bounds,
provisional hinge limits and checks. Each clip is a Float32 little-endian array:
`[frame, robot, rigid group, 16 column-major matrix elements]`. Mesh coordinates
and matrix translations are metres; displacement readouts are millimetres.

The source/exporter is `tools/onshape/export_web_simulation.py` in the Tripteron
repository. It uses the existing inverse kinematics and checks continuous hinge
and rail feasibility along each straight segment before sampling a quintic
time law. Part assignment is checked against both compressed and extended STEP
assemblies. The web client plays these poses; it cannot contact the controller.

Single and paired clips have separate axis limits. Paired clips hold a 1 m span
level. The ROM sweep visits each axis limit through the reference pose, not the
entire 3D workspace. These are 700 mm CAD rails with a 5 mm inset, not the longer
hardware rails. Belts, collisions, loads, attachment details and tracking error
are excluded. The tube is a conceptual light, not another imported CAD part.

## Check

```sh
npm run build
npm run preview -- --host 127.0.0.1 --port 4322
npm run test:simulation
```

Tests use installed Chrome by default. Set `PLAYWRIGHT_CHANNEL` for another
installed channel, and `PORTFOLIO_URL` to check a different preview or deployment.
They inspect canvas pixels, verify visible motion at desktop/mobile sizes, check
all presets and single/paired modes, and exercise failure, reduced-motion and
presentation-navigation states. Screenshots go to `/tmp/tripteron-simulation-tests`.
