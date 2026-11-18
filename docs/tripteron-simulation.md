# Tripteron CAD Motion

The standalone scene lives at `/projects/tripteron/simulation/` and is embedded in
the Tripteron project presentation. Three.js renders actual STEP solids, grouped
into the fixed assembly, platform, three carriages and eight links. The current
design study has 2,000 mm rails; the linkage geometry remains unchanged. It is the
first visual on the project page and the second presentation slide. Follow is on
by default and frames both moving mechanisms, including their opposing offsets.

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

Single and paired clips have separate axis limits. The default tour uses XZ loops
with changing height: first matching world displacement with a level 1 m bar,
then opposing world displacement with independent platforms and no bar. Opposing
vertical amplitude is capped at 250 mm per platform. Opposite in/out motion cannot
preserve a rigid span; the display never stretches a bar to imply otherwise.
Both phases return to reference. XZ loops use a 0.5% inward margin and checked
returns through reference where needed. The opposing tour uses a symmetric XZ
footprint to avoid the single-platform model's nonconvex pockets. Axis sweep visits X and Z limits with
constant Y; the diagonal line is also in XZ. Neither covers the entire workspace.
The rail model repeats a 40 mm section of the source CAD and translates fixed end
hardware symmetrically in the source study, but the web export omits all fixed
accessories except the two rails: the unmated hardware otherwise floats in space.
Rail bounds have a 5 mm inset. Additional 2 mm conservative CAD-box guards keep
the upper carriage above both lower carriages and the platform in front of the
carriage feet. These fix single-robot poses that passed hinge checks despite
crossed carriages. They are not calibrated hardware limits or a complete
collision model. Belts, link-to-link contact, loads, attachment details and
tracking error remain excluded. The tube is a conceptual light.

Schema 4 stores both robots' local poses, per-phase coordination/connector state,
and camera bounds relative to the moving pair's center. B has a 180-degree world-Y
rotation plus a 1 m world-Z translation. Matching uses B_local = A_local * [-1,1,-1];
opposing uses B_local = A_local * [1,-1,1]. Each local path is checked independently.
The schema also exports the analytic leg geometry and linear clearance guards.

## Manual Control

Manual mode has X/Y/Z sliders and numeric millimetre inputs, with a reference
return and independent A/B selection. The sliders show conditional ranges with
the other two axes fixed. `tripteron-kinematics.ts` implements the existing STEP
model's analytic equations; tests compare its rigid transforms with the Python
export for every preset. There is no interpolation between unrelated animations.
Each requested straight move checks exact hinge-span extrema plus linear rail
and clearance constraints. Invalid input is rejected; an out-of-range move stops
just inside the first boundary. Paired manual motion has no connecting bar.
The camera widens if needed after a manual move while retaining the orbit angle.
The browser has no hardware connection.

The plots show computed values, not telemetry: the selected robot's individual
XZ feasibility slice at its Y, independently scaled XYZ time traces, and M/L/R
carriage displacement with rail bounds. A/B switches all three plots. The carriage
mapping and sampled grid use the same model. The grid does not certify joint
feasibility or connected paths. Speeds and time axes use
nominal 1x playback, not a motor-rated trajectory. Follow-camera mode tracks the
moving assembly. Its closer framing uses the projected bounds of individual
moving parts across the clip, keeping both mechanisms in view without changing
zoom during playback. Full view fits the complete rails and motion.

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
