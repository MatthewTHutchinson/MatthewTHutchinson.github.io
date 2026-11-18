# Tripteron CAD Motion

The standalone scene lives at `/projects/tripteron/simulation/` and is embedded in
the Tripteron project presentation. Three.js renders actual STEP solids, grouped
into the fixed assembly, platform, three carriages and eight links. The current
design study has 4,000 mm rails; the linkage geometry remains unchanged.

## Motion Data

`public/media/tripteron/simulation/manifest.json` records the source hash, bounds,
provisional hinge limits and checks. Each clip is a Float32 little-endian array:
`[frame, robot, rigid group, 16 column-major matrix elements]`. Mesh coordinates
and matrix translations are metres; displacement readouts are millimetres.

The source/exporter is `tools/onshape/export_web_simulation.py` in the Tripteron
repository. It uses the existing inverse kinematics and checks continuous hinge
and rail feasibility along every displayed straight segment. Long segments are
subdivided to at most 12 mm per frame for presentation playback. Part assignment
is checked against both compressed and extended source STEP
assemblies. The web client plays these poses; it cannot contact the controller.

Single and paired clips have separate axis limits. Paired clips hold a 1 m span
level. The default tour follows near-boundary loops in XZ, XY and ZY, using a 0.5%
inward margin and checked returns through the reference where necessary. The
axis sweep visits each axis limit directly. Neither covers the entire 3D workspace.
The rail model repeats a 40 mm section of the source CAD and translates fixed end
hardware symmetrically. Rail bounds have a 5 mm inset. Belts, collisions, loads, attachment details and tracking error
are excluded. The tube is a conceptual light, not another imported CAD part.

The plots show computed values, not telemetry: a sampled XZ feasibility slice at
current Y, independently scaled XYZ time traces, and M/L/R carriage displacement
with rail bounds. The carriage mapping and sampled grid are exported from the
same model. The grid does not certify connected paths. Speeds and time axes use
nominal 1x playback, not a motor-rated trajectory. Follow-camera mode tracks the
moving assembly; full view fits the complete rails and motion.

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
