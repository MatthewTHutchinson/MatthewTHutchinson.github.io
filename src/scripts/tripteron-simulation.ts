import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { createMotionPlots, motionPhase, type MotionManifest as Manifest } from './tripteron-plots';
import { createKinematics } from './tripteron-kinematics';

const assets = '/media/tripteron/simulation/';
const revision = '?v=clearance-manual-v4';
const ui = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const main = ui('simulation');
const viewport = ui('viewport');
const status = ui('status');
const canvas = viewport.querySelector('canvas')!;
const play = ui<HTMLButtonElement>('play');
const reset = ui<HTMLButtonElement>('reset');
const timeline = ui<HTMLInputElement>('timeline');
const motion = ui<HTMLSelectElement>('motion');
const cameraMenu = ui<HTMLSelectElement>('camera');
const pathToggle = ui<HTMLInputElement>('path');
const follow = ui<HTMLInputElement>('follow');
const plotsToggle = ui<HTMLInputElement>('plots');
const speed = ui<HTMLSelectElement>('speed');
const retry = ui<HTMLButtonElement>('retry');
retry.onclick = () => location.reload();

async function checkedFetch(path: string) {
  const response = await fetch(assets + path + revision);
  if (!response.ok) throw new Error(`Could not load ${path} (${response.status})`);
  return response;
}

async function initialize() {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setClearColor(0xf1f4f4);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = .95;
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xffffff, 0x819699, 1.5));
  const key = new THREE.DirectionalLight(0xffffff, 2.2);
  key.position.set(2, 3, 4); scene.add(key);
  const fill = new THREE.DirectionalLight(0xe4f7ff, .8);
  fill.position.set(-3, 1, -2); scene.add(fill);
  const camera = new THREE.PerspectiveCamera(36, 1, 0.01, 100);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = .09;
  controls.minDistance = .25;
  controls.maxDistance = 30;
  const manifest: Manifest = await (await checkedFetch('manifest.json')).json();
  if (manifest.schema !== 4 || !manifest.clips.length) throw new Error('Unsupported motion data');
  const kinematics = createKinematics(manifest);
  const plots = createMotionPlots(manifest);
  const assembly = await new GLTFLoader().loadAsync(assets + 'assembly.glb' + revision);
  const roots = [assembly.scene, assembly.scene.clone(true)];
  const groups = roots.map(root => manifest.groups.map(id => {
    const object = root.getObjectByName(`part_${id}`);
    if (!object) throw new Error(`Missing assembly group ${id}`);
    object.matrixAutoUpdate = false;
    return object;
  }));
  const movingCorners = groups[0].slice(1).map(group => {
    group.updateWorldMatrix(true, true);
    const bounds = new THREE.Box3().setFromObject(group)
      .applyMatrix4(group.matrixWorld.clone().invert());
    return [bounds.min.x, bounds.max.x].flatMap(x =>
      [bounds.min.y, bounds.max.y].flatMap(y =>
        [bounds.min.z, bounds.max.z].map(z => new THREE.Vector3(x, y, z))));
  });
  roots.forEach(root => {
    root.traverse(object => {
      if (object instanceof THREE.Mesh) {
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        for (const material of materials) {
          material.metalness = .2;
          material.roughness = .58;
        }
      }
    });
    scene.add(root);
  });
  roots[1].rotation.y = Math.PI;
  roots[1].position.z = manifest.gap_m;

  const bar = new THREE.Mesh(new THREE.CylinderGeometry(.009, .009, manifest.gap_m, 20),
    new THREE.MeshStandardMaterial({ color: 0xf2d48f, emissive: 0xffbd50, emissiveIntensity: .45, roughness: .4 }));
  bar.rotation.x = Math.PI / 2;
  scene.add(bar);
  const ends = [0, 1].map(() => {
    const endpoint = new THREE.Mesh(new THREE.SphereGeometry(.014, 16, 12), new THREE.MeshStandardMaterial({ color: 0xb68c3d, roughness: .5 }));
    scene.add(endpoint); return endpoint;
  });
  const grid = new THREE.GridHelper(6, 30, 0xc1cfd0, 0xe0e7e7);
  grid.position.set(0, manifest.mesh_bounds_m[0][1] - .015, manifest.gap_m / 2);
  scene.add(grid);
  const paths = [0, 1].map(i => {
    const line = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: i ? 0xb48537 : 0x268c94, transparent: true, opacity: .65 }));
    scene.add(line); return line;
  });

  let paired = true;
  let paused = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let visible = true;
  let clip = manifest.clips[0];
  let matrices: Float32Array;
  let position = 0;
  let request = 0;
  let loading = true;
  let dirty = true;
  const lastPlatform = new THREE.Vector3();
  const cache = new Map<string, Float32Array>();
  const stride = 2 * manifest.groups.length * 16;
  let manualRobot = 0;
  let manualPoses = [[0, 0, 0], [0, 0, 0]];
  const isManual = () => motion.value === 'manual';
  const format = (value: number) => (Math.abs(value) < .05 ? 0 : value).toFixed(1);

  function updatePlay() {
    play.toggleAttribute('data-paused', paused);
    play.title = play.ariaLabel = paused ? 'Play' : 'Pause';
  }

  function fitCamera(preserveView = false) {
    const swept = manifest.swept_bounds_m[paired ? 'pair' : 'single'];
    const bounds = new THREE.Box3(new THREE.Vector3(...swept[0]), new THREE.Vector3(...swept[1]));
    if (follow.checked) {
      bounds.set(new THREE.Vector3(...clip.follow_bounds_m[0]), new THREE.Vector3(...clip.follow_bounds_m[1]));
      bounds.translate(lastPlatform);
      if (isManual()) {
        bounds.makeEmpty();
        for (let robot = 0; robot < (paired ? 2 : 1); robot++) {
          roots[robot].updateWorldMatrix(true, true);
          for (const group of groups[robot].slice(1)) bounds.expandByObject(group);
        }
        bounds.expandByScalar(.035);
      }
    }
    const center = bounds.getCenter(new THREE.Vector3());
    const directions: Record<string, THREE.Vector3> = {
      iso: new THREE.Vector3(1.5, .8, 2), front: new THREE.Vector3(0, .1, 1),
      side: new THREE.Vector3(1, .05, 0), top: new THREE.Vector3(0, 1, .001),
    };
    const direction = (preserveView ? camera.position.clone().sub(controls.target) : directions[cameraMenu.value]).normalize();
    camera.position.copy(center).add(direction);
    camera.up.set(0, 1, 0);
    camera.lookAt(center);
    const inverse = camera.quaternion.clone().invert();
    const tanV = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    let distance = 0;
    const fitPoint = (p: THREE.Vector3) => {
      p.applyQuaternion(inverse);
      distance = Math.max(distance, Math.abs(p.x) / (tanV * camera.aspect) + p.z, Math.abs(p.y) / tanV + p.z);
    };
    if (follow.checked && matrices && !isManual()) {
      // Fit each moving part's projected extent, not the empty corners of a swept box.
      // Use the whole clip so playback never needs to change the user's zoom.
      const offset = center.clone().sub(lastPlatform);
      const transform = new THREE.Matrix4();
      const point = new THREE.Vector3();
      roots.forEach(root => root.updateWorldMatrix(true, false));
      for (let frame = 0; frame < clip.frames; frame++) {
        const midpoint = worldPoint(clip.poses_mm[frame], 0);
        if (paired) midpoint.add(worldPoint(clip.poses_b_mm[frame], 1)).multiplyScalar(.5);
        midpoint.add(offset);
        for (let robot = 0; robot < (paired ? 2 : 1); robot++) {
          movingCorners.forEach((corners, index) => {
            transform.fromArray(matrices, frame * stride + (robot * manifest.groups.length + index + 1) * 16);
            transform.premultiply(roots[robot].matrixWorld);
            for (const corner of corners) fitPoint(point.copy(corner).applyMatrix4(transform).sub(midpoint));
          });
        }
      }
    } else {
      for (const x of [bounds.min.x, bounds.max.x]) for (const y of [bounds.min.y, bounds.max.y]) for (const z of [bounds.min.z, bounds.max.z]) {
        fitPoint(new THREE.Vector3(x, y, z).sub(center));
      }
    }
    camera.position.copy(center).addScaledVector(direction, distance * 1.13);
    controls.target.copy(center);
    controls.update();
    main.dataset.cameraDistance = controls.getDistance().toFixed(4);
    dirty = true;
  }

  function setPaths() {
    paths.forEach((path, index) => {
      path.geometry.dispose();
      const poses = index === 0 ? clip.poses_mm : clip.poses_b_mm;
      path.geometry = new THREE.BufferGeometry().setFromPoints(poses.map(p => worldPoint(p, index)));
      path.visible = pathToggle.checked && (paired || index === 0);
    });
  }

  function worldPoint(point: number[], robot: number) {
    return new THREE.Vector3(point[0] * (robot ? -.001 : .001), point[1] / 1000,
      point[2] * (robot ? -.001 : .001) + robot * manifest.gap_m);
  }

  function applyFrame() {
    if (!matrices) return;
    const frame = Math.min(clip.frames - 1, Math.floor(position));
    for (let robot = 0; robot < 2; robot++) {
      const manualMatrices = isManual() ? kinematics.matrices(manualPoses[robot]) : null;
      groups[robot].forEach((group, index) => {
        if (manualMatrices) group.matrix.copy(manualMatrices[index]);
        else group.matrix.fromArray(matrices, frame * stride + (robot * manifest.groups.length + index) * 16);
        group.matrixWorldNeedsUpdate = true;
      });
    }
    const point = isManual() ? manualPoses[0] : clip.poses_mm[frame];
    const a = worldPoint(point, 0), b = worldPoint(isManual() ? manualPoses[1] : clip.poses_b_mm[frame], 1);
    const nextPlatform = paired ? a.clone().add(b).multiplyScalar(.5) : a.clone();
    if (follow.checked) {
      const delta = nextPlatform.clone().sub(lastPlatform);
      camera.position.add(delta); controls.target.add(delta);
    }
    lastPlatform.copy(nextPlatform);
    const phase = motionPhase(clip, frame);
    bar.visible = paired && !isManual() && phase.connector === 'rigid';
    bar.position.copy(a).add(b).multiplyScalar(.5);
    bar.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0), b.clone().sub(a).normalize());
    ends[0].position.copy(a); ends[1].position.copy(b);
    ends.forEach(end => { end.visible = paired; });
    ui('coordination').textContent = phase.coordination === 'together' ? 'Together · fixed span' : phase.coordination === 'opposite' ? 'Opposite · independent platforms' : 'Single platform';
    if (isManual()) ui('coordination').textContent = paired ? 'Manual · independent platforms' : 'Manual · single platform';
    main.dataset.coordination = phase.coordination;
    main.dataset.connector = bar.visible ? 'rigid' : 'none';
    main.dataset.endpoints = JSON.stringify([a.toArray(), b.toArray()]);
    timeline.value = String(frame);
    timeline.setAttribute('aria-valuetext', `${(frame / clip.fps).toFixed(1)} seconds`);
    ui('time').textContent = `${(frame / clip.fps).toFixed(1)} / ${((clip.frames - 1) / clip.fps).toFixed(1)} s`;
    ui('position').textContent = `X ${format(point[0])}   Y ${format(point[1])}   Z ${format(point[2])} mm`;
    main.dataset.frame = String(frame);
    plots.draw(frame);
    if (isManual()) {
      plots.manual(manualPoses[0], manualPoses[1]);
      ui('time').textContent = 'Manual';
    }
    dirty = true;
  }

  async function selectClip(motionId: string) {
    const id = paired ? motionId : 'single-' + motionId;
    const token = ++request;
    ui('manual-controls').hidden = motionId !== 'manual';
    main.dataset.manual = String(motionId === 'manual');
    if (motionId === 'manual') {
      paused = true; loading = false; position = 0; updatePlay();
      manualPoses = [[0, 0, 0], [0, 0, 0]];
      manualRobot = 0;
      const base = manifest.clips.find(c => c.id === (paired ? 'tour' : 'single-tour'))!;
      clip = { ...base, id: 'manual', manual: true, frames: 2, fps: 1,
        poses_mm: [manualPoses[0], manualPoses[0]], poses_b_mm: [manualPoses[1], manualPoses[1]],
        phases: [{ start_frame: 0, end_frame: 1, coordination: paired ? 'opposite' : 'single', connector: 'none' }] };
      plots.configure(clip, paired);
      const plotChoice = document.querySelector<HTMLInputElement>('input[name="plot-robot"][value="0"]')!;
      plotChoice.checked = true; plotChoice.dispatchEvent(new Event('change'));
      paths.forEach(path => { path.visible = false; });
      play.disabled = timeline.disabled = speed.disabled = pathToggle.disabled = true;
      reset.disabled = false;
      updateManualControls(); applyFrame(); fitCamera();
      main.dataset.motion = id;
      return;
    }
    const next = manifest.clips.find(c => c.id === id)!;
    loading = true;
    play.disabled = reset.disabled = timeline.disabled = true;
    try {
      let data = cache.get(id);
      if (!data) {
        const buffer = await (await checkedFetch(next.file)).arrayBuffer();
        data = new Float32Array(buffer);
        if (data.length !== next.frames * stride || !data.every(Number.isFinite)) throw new Error('Invalid motion data');
        cache.set(id, data);
      }
      if (token !== request) return;
      clip = next; matrices = data; position = 0;
      timeline.max = String(clip.frames - 1);
      plots.configure(clip, paired);
      setPaths(); applyFrame(); fitCamera();
      status.hidden = true;
      main.dataset.state = 'ready';
      main.dataset.motion = id;
      play.disabled = reset.disabled = timeline.disabled = motion.disabled = false;
      speed.disabled = pathToggle.disabled = false;
      loading = false;
    } catch (error) {
      if (token === request) showError(error);
    }
  }

  function updateManualControls(reason = '') {
    for (const [axis, label] of ['X', 'Y', 'Z'].entries()) {
      const slider = ui<HTMLInputElement>('manual-' + label);
      const number = ui<HTMLInputElement>('manual-' + label + '-value');
      const [lo, hi] = kinematics.axisBounds(manualPoses[manualRobot], axis);
      slider.min = String(Math.min(Math.ceil(lo * 10) / 10, manualPoses[manualRobot][axis]));
      slider.max = String(Math.max(Math.floor(hi * 10) / 10, manualPoses[manualRobot][axis]));
      slider.value = number.value = manualPoses[manualRobot][axis].toFixed(1);
      slider.setAttribute('aria-valuetext', `${number.value} millimetres`);
    }
    const status = ui('manual-status');
    status.textContent = reason ? `Stopped: ${reason}` : 'mm from reference';
    status.toggleAttribute('data-limited', !!reason);
    for (const radio of document.querySelectorAll<HTMLInputElement>('input[name="manual-robot"]')) {
      radio.checked = Number(radio.value) === manualRobot;
      radio.disabled = !paired && radio.value === '1';
    }
    main.dataset.manualPose = JSON.stringify(manualPoses);
  }

  function moveManual(target: number[]) {
    if (!isManual()) return;
    const result = kinematics.move(manualPoses[manualRobot], target);
    manualPoses[manualRobot] = result.point;
    updateManualControls(result.reason); applyFrame();
    // Widen only when a manual move would take a mechanism off screen; retain orbit.
    if (follow.checked) {
      scene.updateMatrixWorld(true); camera.updateMatrixWorld();
      let outside = false;
      for (let robot = 0; robot < (paired ? 2 : 1); robot++) {
        movingCorners.forEach((corners, index) => {
          for (const corner of corners) {
            const p = corner.clone().applyMatrix4(groups[robot][index + 1].matrixWorld).project(camera);
            if (Math.abs(p.x) > .88 || Math.abs(p.y) > .88 || p.z > 1) outside = true;
          }
        });
      }
      if (outside) fitCamera(true);
    }
  }

  for (const [axis, label] of ['X', 'Y', 'Z'].entries()) {
    const change = (input: HTMLInputElement) => {
      const target = manualPoses[manualRobot].slice(); target[axis] = input.value === '' ? NaN : Number(input.value);
      moveManual(target);
    };
    const slider = ui<HTMLInputElement>('manual-' + label), number = ui<HTMLInputElement>('manual-' + label + '-value');
    slider.oninput = () => change(slider); number.onchange = () => change(number);
  }
  ui('manual-home').onclick = () => moveManual([0, 0, 0]);
  for (const input of document.querySelectorAll<HTMLInputElement>('input[name="manual-robot"]')) {
    input.onchange = () => {
      manualRobot = Number(input.value); updateManualControls();
      const plotChoice = document.querySelector<HTMLInputElement>(`input[name="plot-robot"][value="${manualRobot}"]`)!;
      plotChoice.checked = true; plotChoice.dispatchEvent(new Event('change'));
    };
  }

  function showRanges() {
    ui('ranges').replaceChildren();
    for (const [index, range] of (paired ? manifest.paired_ranges_mm : manifest.single_ranges_mm).entries()) {
      const row = document.createElement('div');
      const dt = document.createElement('dt'); dt.textContent = ['X', 'Y', 'Z'][index];
      const dd = document.createElement('dd'); dd.textContent = `${format(range[0])} to ${format(range[1])} mm`;
      row.append(dt, dd); ui('ranges').append(row);
    }
  }
  play.onclick = () => { paused = !paused; updatePlay(); };
  reset.onclick = () => { if (isManual()) moveManual([0, 0, 0]); else { position = 0; paused = true; updatePlay(); applyFrame(); } };
  timeline.oninput = () => { position = Number(timeline.value); paused = true; updatePlay(); applyFrame(); };
  motion.onchange = () => void selectClip(motion.value);
  cameraMenu.onchange = () => fitCamera();
  ui('fit').onclick = () => fitCamera();
  pathToggle.onchange = () => { setPaths(); dirty = true; };
  follow.onchange = () => fitCamera();
  plotsToggle.onchange = () => {
    main.dataset.plots = plotsToggle.checked ? 'on' : 'off';
    plots.setVisible(plotsToggle.checked);
  };
  for (const input of document.querySelectorAll<HTMLInputElement>('input[name="assembly"]')) {
    input.onchange = () => {
      paired = input.value === 'pair'; roots[1].visible = paired;
      void selectClip(motion.value); showRanges(); main.dataset.assembly = input.value;
    };
  }
  ui('fullscreen').onclick = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await main.requestFullscreen();
    } catch { window.open(location.pathname, '_blank', 'noopener'); }
  };
  canvas.onkeydown = event => {
    if (event.code === 'Space' && !isManual()) { event.preventDefault(); paused = !paused; updatePlay(); }
  };
  controls.addEventListener('change', () => { dirty = true; });
  const resize = new ResizeObserver(() => {
    const { width, height } = viewport.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height; camera.updateProjectionMatrix();
    fitCamera();
    dirty = true;
  });
  resize.observe(viewport);
  const visibility = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; dirty = true; });
  visibility.observe(document.querySelector('.workbench')!);
  let last = performance.now();
  renderer.setAnimationLoop(now => {
    const delta = Math.min((now - last) / 1000, .1); last = now;
    if (document.hidden || !visible) return;
    if (!paused && !loading) {
      position = (position + delta * clip.fps * Number(speed.value)) % (clip.frames - 1);
      applyFrame();
    }
    controls.update();
    if (dirty) { renderer.render(scene, camera); dirty = false; }
  });
  canvas.addEventListener('webglcontextlost', event => {
    event.preventDefault(); renderer.setAnimationLoop(null);
    showError(new Error('The 3D view was interrupted. Reload to continue.'));
  });
  window.addEventListener('pagehide', event => {
    if (!event.persisted) { renderer.setAnimationLoop(null); controls.dispose(); resize.disconnect(); visibility.disconnect(); plots.dispose(); renderer.dispose(); }
  });
  showRanges();
  updatePlay();
  await selectClip(clip.id);
}

function showError(error: unknown) {
  main.dataset.state = 'error';
  status.hidden = false;
  status.querySelector('span')!.textContent = 'The 3D assembly could not load. Please reload or try a browser with WebGL enabled.';
  retry.hidden = false;
  console.error(error);
}

initialize().catch(showError);
