export type MotionClip = { id: string; label: string; fps: number; frames: number; file: string; poses_mm: number[][] };
type Grid = { x_mm: number[]; z_mm: number[]; step_mm: number; y_bounds_mm: ([number, number] | null)[] };
export type MotionManifest = {
  schema: number; groups: number[]; gap_m: number; mesh_bounds_m: number[][];
  swept_bounds_m: Record<string, number[][]>; paired_ranges_mm: number[][]; single_ranges_mm: number[][];
  carriage_matrix: number[][]; carriage_bounds_mm: number[][]; workspace_grids: Record<string, Grid>; clips: MotionClip[];
};

const colors = ['#bd563f', '#167d83', '#4b68ae'];
const el = (id: string) => document.getElementById(id)!;
const round = (n: number) => (Math.round(n) || 0).toLocaleString('en-US');

function context(id: string) {
  const canvas = el(id) as HTMLCanvasElement;
  const { width, height } = canvas.getBoundingClientRect();
  const ratio = Math.min(devicePixelRatio, 2);
  if (!width || !height) return null;
  if (canvas.width !== Math.round(width * ratio) || canvas.height !== Math.round(height * ratio)) {
    canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
  }
  const ctx = canvas.getContext('2d')!;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.clearRect(0, 0, width, height);
  ctx.font = '10px ui-monospace, monospace'; ctx.lineWidth = 1;
  return { ctx, width, height };
}

export function createMotionPlots(manifest: MotionManifest) {
  let clip: MotionClip;
  let paired = true;
  let frame = 0;
  let robot = 0;
  let shown = true;
  let limits: number[][] = [];
  let grid: Grid;
  let footprint: [number, number, number, number] = [-100, 100, -100, 100];
  let visibleCells: { x: number; z: number; low: number; high: number }[] = [];
  const matrix = manifest.carriage_matrix;
  const railBounds = manifest.carriage_bounds_mm;

  function configure(next: MotionClip, isPair: boolean) {
    clip = next; paired = isPair;
    if (!paired) {
      robot = 0;
      (document.querySelector('input[name="plot-robot"][value="0"]') as HTMLInputElement).checked = true;
    }
    (document.querySelector('input[name="plot-robot"][value="1"]') as HTMLInputElement).disabled = !paired;
    grid = manifest.workspace_grids[paired ? 'pair' : 'single'];
    visibleCells = grid.y_bounds_mm.flatMap((range, index) => range ? [{
      x: grid.x_mm[index % grid.x_mm.length], z: grid.z_mm[Math.floor(index / grid.x_mm.length)], low: range[0], high: range[1],
    }] : []);
    footprint = [Math.min(...visibleCells.map(c => c.x))-10, Math.max(...visibleCells.map(c => c.x))+10,
      Math.min(...visibleCells.map(c => c.z))-10, Math.max(...visibleCells.map(c => c.z))+10];
    limits = [0, 1, 2].map(axis => {
      const values = next.poses_mm.map(p => p[axis]);
      const min = Math.min(...values), max = Math.max(...values);
      const pad = Math.max((max-min)*.08, 1);
      return [min-pad, max+pad];
    });
  }

  function workspace() {
    const surface = context('workspace-plot'); if (!surface) return;
    const { ctx, width, height } = surface;
    const point = clip.poses_mm[frame];
    const [xmin, xmax, zmin, zmax] = footprint;
    const scale = Math.min((width-52)/(xmax-xmin), (height-32)/(zmax-zmin));
    const left = 35 + (width-52-(xmax-xmin)*scale)/2;
    const top = 7 + (height-32-(zmax-zmin)*scale)/2;
    const x = (value: number) => left+(value-xmin)*scale;
    const z = (value: number) => top+(zmax-value)*scale;
    for (const cell of visibleCells) {
      ctx.fillStyle = point[1] >= cell.low && point[1] <= cell.high ? '#90c5c5' : '#e0e5e7';
      ctx.fillRect(x(cell.x-grid.step_mm/2), z(cell.z+grid.step_mm/2), grid.step_mm*scale+.25, grid.step_mm*scale+.25);
    }
    ctx.strokeStyle = '#c0cbce'; ctx.setLineDash([3, 3]); ctx.beginPath();
    ctx.moveTo(x(0), z(zmin)); ctx.lineTo(x(0), z(zmax)); ctx.moveTo(x(xmin), z(0)); ctx.lineTo(x(xmax), z(0)); ctx.stroke(); ctx.setLineDash([]);
    ctx.strokeStyle = '#8d7a56'; ctx.lineWidth = 1; ctx.beginPath();
    clip.poses_mm.forEach((p, i) => { if (i === 0) ctx.moveTo(x(p[0]), z(p[2])); else ctx.lineTo(x(p[0]), z(p[2])); }); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.strokeStyle = '#203c40'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x(point[0]), z(point[2]), 4, 0, Math.PI*2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#536168'; ctx.textAlign = 'center';
    for (const value of [xmin+10, 0, xmax-10]) ctx.fillText(round(value), x(value), height-12);
    ctx.textAlign = 'right'; for (const value of [zmin+10, 0, zmax-10]) ctx.fillText(round(value), left-5, z(value)+3);
    ctx.textAlign = 'left'; ctx.fillText('Z', 4, 11); ctx.fillText('X mm', width-30, height-1);
    el('slice-height').textContent = `Y = ${round(point[1])} mm`;
  }

  function positionPlot() {
    const surface = context('position-plot'); if (!surface) return;
    const { ctx, width, height } = surface;
    const left = 48, right = width-8, rowHeight = (height-16)/3;
    const x = (index: number) => left+(right-left)*index/(clip.frames-1);
    for (let axis = 0; axis < 3; axis++) {
      const [min, max] = limits[axis];
      const top = axis*rowHeight+4, bottom = top+rowHeight-9;
      const y = (value: number) => bottom-(value-min)/(max-min)*(bottom-top);
      ctx.strokeStyle = '#d6dfe1'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(left, bottom); ctx.lineTo(right, bottom); ctx.stroke();
      ctx.fillStyle = '#637077'; ctx.textAlign = 'right'; ctx.fillText(round(max), left-7, top+7); ctx.fillText(round(min), left-7, bottom);
      ctx.fillStyle = colors[axis]; ctx.textAlign = 'left'; ctx.fillText(['X', 'Y', 'Z'][axis], 0, top+rowHeight/2);
      ctx.strokeStyle = colors[axis]; ctx.beginPath();
      clip.poses_mm.forEach((p, i) => { if (i === 0) ctx.moveTo(x(i), y(p[axis])); else ctx.lineTo(x(i), y(p[axis])); }); ctx.stroke();
      ctx.fillStyle = colors[axis]; ctx.beginPath(); ctx.arc(x(frame), y(clip.poses_mm[frame][axis]), 3, 0, Math.PI*2); ctx.fill();
    }
    ctx.strokeStyle = '#394d56'; ctx.setLineDash([2, 2]); ctx.beginPath(); ctx.moveTo(x(frame), 0); ctx.lineTo(x(frame), height-16); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = '#637077'; ctx.textAlign = 'left'; ctx.fillText('0', left, height-1); ctx.textAlign = 'right'; ctx.fillText(`${((clip.frames-1)/clip.fps).toFixed(1)} s`, right, height-1);
    const a = Math.max(0, frame-1), b = Math.min(clip.frames-1, frame+1);
    const velocity = Math.hypot(...clip.poses_mm[b].map((n, i) => (n-clip.poses_mm[a][i])*clip.fps/(b-a || 1)));
    el('nominal-speed').textContent = `${round(velocity)} mm/s`;
  }

  function carriages() {
    const surface = context('carriage-plot'); if (!surface) return;
    const { ctx, width } = surface;
    const point = clip.poses_mm[frame].map((n, axis) => robot === 1 && axis !== 1 ? -n : n);
    let margin = Infinity;
    const values = matrix.map(row => row.reduce((sum, n, i) => sum+n*point[i], 0));
    values.forEach((value, axis) => {
      const [lo, hi] = railBounds[axis]; margin = Math.min(margin, value-lo, hi-value);
      const top = axis*46+7, left = 27, right = width-3;
      const x = (v: number) => left+(v-lo)/(hi-lo)*(right-left);
      ctx.textAlign = 'left'; ctx.fillStyle = '#37474d'; ctx.fillText(['M', 'L', 'R'][axis], 0, top+12);
      ctx.fillStyle = '#e0e6e8'; ctx.fillRect(left, top+8, right-left, 5);
      ctx.strokeStyle = '#9dabad'; ctx.beginPath(); ctx.moveTo(x(0), top+4); ctx.lineTo(x(0), top+17); ctx.stroke();
      ctx.fillStyle = '#167d83'; ctx.fillRect(x(value)-2, top+3, 4, 15);
      ctx.fillStyle = '#37474d'; ctx.textAlign = 'center'; ctx.fillText(`${round(value)} mm`, (left+right)/2, top-1);
      ctx.fillStyle = '#637077'; ctx.textAlign = 'left'; ctx.fillText(round(lo), left, top+28); ctx.textAlign = 'right'; ctx.fillText(round(hi), right, top+28);
    });
    el('rail-margin').textContent = `Rail margin ${round(margin)} mm`;
    el('carriage-plot').dataset.values = values.map(n => n.toFixed(3)).join(',');
  }

  function draw(nextFrame = frame) {
    frame = nextFrame;
    if (!shown || !clip) return;
    workspace(); positionPlot(); carriages();
    el('analysis').dataset.frame = String(frame);
  }
  for (const input of document.querySelectorAll<HTMLInputElement>('input[name="plot-robot"]')) {
    input.onchange = () => { robot = Number(input.value); draw(); };
  }
  const resize = new ResizeObserver(() => draw());
  resize.observe(el('analysis'));
  return { configure, draw, setVisible(value: boolean) { shown = value; draw(); }, dispose() { resize.disconnect(); } };
}
