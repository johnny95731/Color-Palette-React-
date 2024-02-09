import {getSpaceTrans} from "./colors.ts";
import {HSL_MAXES} from "./constants.ts";
import {elementwiseMean} from "./helpers.ts";
import {Blender} from "types/utilTypes.ts";
import type {ColorSpacesType} from "types/pltType.ts";

/**
 * Blending two colors by evaluate their average.
 * @param color1 Numeric of a color.
 * @param color2 Numeric of a color.
 * @param colorSpace Color space.
 * @returns The mean value of color1 and color2.
 */
export const meanBlend = (
    color1: number[], color2: number[], colorSpace: ColorSpacesType,
): number[] => {
  const {converter, inverter} = getSpaceTrans(colorSpace);
  const newColor = elementwiseMean(
      converter(color1), converter(color2),
  );
  return inverter(newColor);
};

const GAMMA_CONST = 2**(- 2 / 255);
/**
 * Blending two colors by  illusions.hu's Soft Light formula.
 * @param color1 Numeric of a color.
 * @param color2 Numeric of a color.
 * @returns The mean value of color1 and color2.
 */
const softLightBlend: Blender = (color1, color2) => {
  const newColor = new Array(color1.length);
  for (let i = 0; i < color1.length; i++) {
    newColor[i] = 255 * (color1[i] / 255) ** (2 * GAMMA_CONST**color2[i]);
  }
  return newColor;
};

/**
 * Take the mean blend of color1 and color2 and do gamma correction to adjust
 * saturation and luminance.
 * @param color1 A RGB array.
 * @param color2 A RGB array.
 * @param gamma Gamma-corection coefficient. The color is deeper if gamma > 1.
 *   The color is brighter if gamma < 1.
 * @returns The blend color of color1 and color2.
 */
const blendNGamma = (
    color1: number[], color2: number[], gamma: number = 0.3,
) => {
  /**
   * Scaling coefficients of saturation and luminance.
   */
  const sacleCoeff = HSL_MAXES.slice(1).map(
      (val) => Math.pow(val, (1 - gamma)));
  const mean = elementwiseMean(color1, color2);
  const {converter, inverter} = getSpaceTrans("hsl");
  const [hue, sat, lum] = converter(mean);
  const newSat = Math.pow(sat, gamma) * sacleCoeff[0];
  const newLum = Math.pow(lum, gamma) * sacleCoeff[1];
  return inverter([hue, newSat, newLum]);
};

const brighter: Blender = (color1, color2) => blendNGamma(color1, color2);
const deeperBlend: Blender = (color1, color2) => {
  return blendNGamma(color1, color2, 1.5);
};

export const blenders = Object.freeze({
  "mean": meanBlend,
  "brighter": brighter,
  "deeper": deeperBlend,
  "soft light": softLightBlend,
});
