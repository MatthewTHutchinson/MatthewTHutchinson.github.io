import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { createMotionPlots, motionPhase, type MotionManifest as Manifest } from './tripteron-plots';

const assets = '/media/tripteron/simulation/';
const revision = '?v=rail2000-paired-v3';
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
  if (manifest.schema !== 3 || !manifest.clips.length) throw new Error('Unsupported motion data');
  const plots = createMotionPlots(manifest);
  const assembly = await new GLTFLoader().loadAsync(assets + 'assembly.glb' + revision);
  const roots = [assembly.scene, assembly.scene.clone(true)];
  const groups = roots.map(root => manifest.groups.map(id => {
    const object = root.getObjectByName(`part_${id}`);
    if (!object) throw new Error(`Missing assembly group ${id}`);
    object.matrixAutoUpdate = false;
    return object;
  }));
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
  const format = (value: number) => (Math.abs(value) < .05 ? 0 : value).toFixed(1);

  function updatePlay() {
    play.toggleAttribute('data-paused', paused);
    play.title = play.ariaLabel = paused ? 'Play' : 'Pause';
  }

  function fitCamera() {
    const swept = manifest.swept_bounds_m[paired ? 'pair' : 'single'];
    const bounds = new THREE.Box3(new THREE.Vector3(...swept[0]), new THREE.Vector3(...swept[1]));
    if (follow.checked) {
      bounds.set(new THREE.Vector3(...clip.follow_bounds_m[0]), new THREE.Vector3(...clip.follow_bounds_m[1]));
      bounds.translate(lastPlatform);
      bounds.expandByScalar(.07);
    }
    const center = bounds.getCenter(new THREE.Vector3());
    const directions: Record<string, THREE.Vector3> = {
      iso: new THREE.Vector3(1.5, .8, 2), front: new THREE.Vector3(0, .1, 1),
      side: new THREE.Vector3(1, .05, 0), top: new THREE.Vector3(0, 1, .001),
    };
    const direction = directions[cameraMenu.value].normalize();
    camera.position.copy(center).add(direction);
    camera.up.set(0, 1, 0);
    camera.lookAt(center);
    const inverse = camera.quaternion.clone().invert();
    const tanV = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    let distance = 0;
    // Fit projected corners across the entire motion, with room for the readout.
    for (const x of [bounds.min.x, bounds.max.x]) for (const y of [bounds.min.y, bounds.max.y]) for (const z of [bounds.min.z, bounds.max.z]) {
      const p = new THREE.Vector3(x, y, z).sub(center).applyQuaternion(inverse);
      distance = Math.max(distance, Math.abs(p.x) / (tanV * camera.aspect) + p.z, Math.abs(p.y) / tanV + p.z);
    }
    camera.position.copy(center).addScaledVector(direction, distance * 1.13);
    controls.target.copy(center);
    controls.update();
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
      groups[robot].forEach((group, index) => {
        group.matrix.fromArray(matrices, frame * stride + (robot * manifest.groups.length + index) * 16);
        group.matrixWorldNeedsUpdate = true;
      });
    }
    const point = clip.poses_mm[frame];
    const a = worldPoint(point, 0), b = worldPoint(clip.poses_b_mm[frame], 1);
    const nextPlatform = paired ? a.clone().add(b).multiplyScalar(.5) : a.clone();
    if (follow.checked) {
      const delta = nextPlatform.clone().sub(lastPlatform);
      camera.position.add(delta); controls.target.add(delta);
    }
    lastPlatform.copy(nextPlatform);
    const phase = motionPhase(clip, frame);
    bar.visible = paired && phase.connector === 'rigid';
    bar.position.copy(a).add(b).multiplyScalar(.5);
    bar.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0), b.clone().sub(a).normalize());
    ends[0].position.copy(a); ends[1].position.copy(b);
    ends.forEach(end => { end.visible = paired; });
    ui('coordination').textContent = phase.coordination === 'together' ? 'Together · fixed span' : phase.coordination === 'opposite' ? 'Opposite · independent platforms' : 'Single platform';
    main.dataset.coordination = phase.coordination;
    main.dataset.connector = bar.visible ? 'rigid' : 'none';
    main.dataset.endpoints = JSON.stringify([a.toArray(), b.toArray()]);
    timeline.value = String(frame);
    timeline.setAttribute('aria-valuetext', `${(frame / clip.fps).toFixed(1)} seconds`);
    ui('time').textContent = `${(frame / clip.fps).toFixed(1)} / ${((clip.frames - 1) / clip.fps).toFixed(1)} s`;
    ui('position').textContent = `X ${format(point[0])}   Y ${format(point[1])}   Z ${format(point[2])} mm`;
    main.dataset.frame = String(frame);
    plots.draw(frame);
    dirty = true;
  }

  async function selectClip(motionId: string) {
    const id = paired ? motionId : 'single-' + motionId;
    const token = ++request;
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
      loading = false;
    } catch (error) {
      if (token === request) showError(error);
    }
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
  reset.onclick = () => { position = 0; paused = true; updatePlay(); applyFrame(); };
  timeline.oninput = () => { position = Number(timeline.value); paused = true; updatePlay(); applyFrame(); };
  motion.onchange = () => void selectClip(motion.value);
  cameraMenu.onchange = fitCamera;
  ui('fit').onclick = fitCamera;
  pathToggle.onchange = () => { setPaths(); dirty = true; };
  follow.onchange = fitCamera;
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
    if (event.code === 'Space') { event.preventDefault(); paused = !paused; updatePlay(); }
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
