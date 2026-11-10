import { Platform } from "react-native";
import { matrixPropsForPlatform, type SvgMatrix } from "./svgTransformMath";
const nativeSvg = Platform.OS !== "web";
export function svgMatrixProps(matrix: SvgMatrix) {
  "worklet";
  return matrixPropsForPlatform(matrix, nativeSvg);
}
