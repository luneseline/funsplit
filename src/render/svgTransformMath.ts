/** SVG affine matrices use [a,b,c,d,e,f], including pivot translation. */
export type SvgMatrix = [number, number, number, number, number, number];
export function rotateAbout(degrees: number, x: number, y: number): SvgMatrix {
  "worklet";
  const r = (degrees * Math.PI) / 180,
    c = Math.cos(r),
    s = Math.sin(r);
  return [c, s, -s, c, x * (1 - c) + y * s, y * (1 - c) - x * s];
}
export function translateSvg(x: number, y: number): SvgMatrix {
  "worklet";
  return [1, 0, 0, 1, x, y];
}
export type AnimatedSvgMatrixProps = { matrix?: SvgMatrix; transform?: string };
export function matrixPropsForPlatform(
  matrix: SvgMatrix,
  native: boolean,
): AnimatedSvgMatrixProps {
  "worklet";
  // RNSVGGroup's native prop is `matrix`. `transform` would be intercepted
  // by Reanimated's View/CSS transform processor before reaching SVG.
  return native ? { matrix } : { transform: `matrix(${matrix.join(",")})` };
}
