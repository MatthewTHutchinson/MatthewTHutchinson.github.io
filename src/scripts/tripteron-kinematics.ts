import { Matrix3, Matrix4, Vector3 } from 'three';

type Leg = {
  label: string; n: number[]; c: number[]; k: number[]; p: number[]; d: number[]; J: number[][];
  l1: number; l2: number; branch: number; knee_axial: number; lo: number; hi: number;
  links: number[]; carriage_group: number;
};
export type KinematicModel = {
  origin_mm: number[]; legs: Leg[];
  clearance_planes: { name: string; normal: number[]; minimum: number }[];
};
type ModelData = { kinematics: KinematicModel; groups: number[]; carriage_matrix: number[][]; carriage_bounds_mm: number[][] };
const v = (point: number[]) => new Vector3(...point);
const dot = (a: number[], b: number[]) => a.reduce((sum, value, i) => sum + value * b[i], 0);

// The offline STEP model's analytic IK, in robot-aligned reference millimetres.
// No hardware calibration, transport or command interface is used here.
export function createKinematics(data: ModelData) {
  const model = data.kinematics;
  const legs = model.legs.map(leg => ({ ...leg, normal: v(leg.n), jacobian: new Matrix3().set(...leg.J.flat() as [number,number,number,number,number,number,number,number,number]) }));

  function segmentReason(start: number[], end: number[]) {
    if ([start, end].some(p => p.length !== 3 || !p.every(Number.isFinite))) return 'Invalid coordinates';
    for (const plane of model.clearance_planes) {
      if ([start, end].some(p => dot(p, plane.normal) < plane.minimum - 1e-7)) return plane.name;
    }
    for (let i = 0; i < 3; i++) {
      const [lo, hi] = data.carriage_bounds_mm[i];
      if ([start, end].some(p => { const q = dot(p, data.carriage_matrix[i]); return q < lo - 1e-7 || q > hi + 1e-7; })) return `${['Upper', 'Left', 'Right'][i]} rail limit`;
    }
    for (const leg of legs) {
      const a = v(start).applyMatrix3(leg.jacobian).add(v(leg.d));
      const delta = v(end).sub(v(start)).applyMatrix3(leg.jacobian);
      const t = delta.lengthSq() ? Math.max(0, Math.min(1, -a.dot(delta) / delta.lengthSq())) : 0;
      const low = a.clone().addScaledVector(delta, t).length();
      const high = Math.max(a.length(), a.clone().add(delta).length());
      if (low < leg.lo - 1e-7 || high > leg.hi + 1e-7) return `Leg ${leg.label} hinge limit`;
    }
    return '';
  }

  function move(start: number[], target: number[]) {
    const reason = segmentReason(start, target);
    if (!reason) return { point: target.slice(), reason: '' };
    if (segmentReason(start, start) || !target.every(Number.isFinite)) return { point: start.slice(), reason };
    let low = 0, high = 1;
    for (let i = 0; i < 40; i++) {
      const middle = (low + high) / 2;
      const candidate = start.map((value, axis) => value + middle * (target[axis] - value));
      if (segmentReason(start, candidate)) high = middle; else low = middle;
    }
    // Stay slightly inside the first boundary, including nonconvex hinge pockets.
    return { point: start.map((value, axis) => value + low * .999999 * (target[axis] - value)), reason };
  }

  function axisBounds(point: number[], axis: number) {
    return [-1, 1].map(sign => {
      const target = point.slice(); target[axis] += sign * 10000;
      return move(point, target).point[axis];
    });
  }

  function matrices(point: number[]) {
    const reason = segmentReason(point, point);
    if (reason) throw new Error(reason);
    const output = new Map<number, Matrix4>([[0, new Matrix4()], [3, new Matrix4().makeTranslation(...point.map(n => n / 1000) as [number,number,number])]]);
    const origin = v(model.origin_mm);
    for (const leg of legs) {
      const n = leg.normal;
      const shift = new Vector3(0, dot(leg.n, point) / leg.n[1], 0);
      output.set(leg.carriage_group, new Matrix4().makeTranslation(0, shift.y / 1000, 0));
      const d = v(point).applyMatrix3(leg.jacobian).add(v(leg.d));
      const r = d.length(), e = d.clone().divideScalar(r);
      const along = (leg.l1 ** 2 - leg.l2 ** 2 + r * r) / (2 * r);
      const height = Math.sqrt(Math.max(0, leg.l1 ** 2 - along ** 2));
      const knee = v(leg.c).add(shift).addScaledVector(e, along)
        .addScaledVector(n.clone().cross(e), leg.branch * height).addScaledVector(n, leg.knee_axial);
      for (let i = 0; i < 2; i++) {
        const pivot = v(i ? leg.p : leg.c), delta = i ? v(point) : shift;
        const old = v(leg.k).sub(pivot), next = knee.clone().sub(pivot).sub(delta);
        old.addScaledVector(n, -n.dot(old)); next.addScaledVector(n, -n.dot(next));
        const angle = Math.atan2(n.dot(old.clone().cross(next)), old.dot(next));
        const rotation = new Matrix4().makeRotationAxis(n, angle);
        const translation = pivot.clone().add(delta).sub(pivot.clone().applyMatrix4(rotation))
          .add(origin.clone().applyMatrix4(rotation)).sub(origin).divideScalar(1000);
        output.set(leg.links[i], rotation.setPosition(translation));
      }
    }
    return data.groups.map(id => output.get(id)!);
  }
  return { segmentReason, move, axisBounds, matrices };
}
