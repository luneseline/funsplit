import { test } from "node:test";
import assert from "node:assert/strict";
import {
  rotateAbout,
  translateSvg,
  matrixPropsForPlatform,
  type SvgMatrix,
} from "../src/render/svgTransformMath.ts";
const apply = (m: SvgMatrix, x: number, y: number) => [
  m[0] * x + m[2] * y + m[4],
  m[1] * x + m[3] * y + m[5],
];
const close = (actual: number[], expected: number[]) =>
  actual.forEach((n, i) =>
    assert.ok(Math.abs(n - expected[i]) < 1e-9, `${actual} != ${expected}`),
  );
test("rotating SVG limbs preserves their shoulder/hip pivot at every pose", () => {
  for (const [x, y] of [
    [32, 66],
    [70, 66],
    [38, 80],
    [65, 80],
  ])
    for (let angle = -90; angle <= 90; angle += 3) {
      const m = rotateAbout(angle, x, y);
      close(apply(m, x, y), [x, y]);
      const r = (angle * Math.PI) / 180;
      close(apply(m, x + 10, y), [x + 10 * Math.cos(r), y + 10 * Math.sin(r)]);
    }
});
test("native animated SVG props bypass the View transform parser entirely", () => {
  for (const m of [
    translateSvg(150, 135),
    rotateAbout(32, 32, 66),
    rotateAbout(-45, 70, 66),
  ]) {
    const props = matrixPropsForPlatform(m, true);
    assert.deepEqual(Object.keys(props), ["matrix"]);
    assert.deepEqual(props.matrix, m);
    assert.equal(m.length, 6);
    assert.ok(m.every(Number.isFinite));
    assert.equal("transform" in props, false);
  }
});
test("web matrix and native matrix produce identical crosshair, ball and limb geometry", () => {
  for (const m of [
    translateSvg(30, 15),
    translateSvg(220, 90),
    rotateAbout(30, 32, 66),
  ]) {
    const native = matrixPropsForPlatform(m, true).matrix!,
      web = matrixPropsForPlatform(m, false).transform!;
    const parsed = web.slice(7, -1).split(",").map(Number) as SvgMatrix;
    assert.deepEqual(parsed, native);
    close(apply(parsed, 13, 17), apply(native, 13, 17));
  }
});
