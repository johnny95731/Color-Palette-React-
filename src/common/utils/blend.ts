import {ColorSpacesType} from "src/features/types/optionsType.ts";
import {getSpaceInfos, HSL_MAXES} from "./colors.ts";
import {elementwiseMean} from "./helpers.ts";
type blend = (c1: number[], c2: number[]) => number[];

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
  const {converter, inverter} = getSpaceInfos(colorSpace);
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
const softLightBlend: blend = (color1, color2) => {
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
const gammaBlend = (
    color1: number[], color2: number[], gamma: number = 0.3,
) => {
  /**
   * Scaling coefficients of saturation and luminance.
   */
  const sacleCoeff = HSL_MAXES.slice(1).map(
      (val) => Math.pow(val, (1 - gamma)));
  const {converter, inverter} = getSpaceInfos("hsl");
  const mean = elementwiseMean(color1, color2);
  const [hue, sat, lum] = converter(mean);
  const newSat = Math.pow(sat, gamma) * sacleCoeff[0];
  const newLum = Math.pow(lum, gamma) * sacleCoeff[1];
  return inverter([hue, newSat, newLum]);
};

const brighter: blend = (color1, color2) => gammaBlend(color1, color2);
const deeperBlend: blend = (color1, color2) => gammaBlend(color1, color2, 1.5);

export const blendBy = {
  "mean": meanBlend,
  "brighter": brighter,
  "deeper": deeperBlend,
  "soft light": softLightBlend,
};
