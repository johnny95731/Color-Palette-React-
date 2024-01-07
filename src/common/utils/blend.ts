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
export const softLightBlend: blend = (color1, color2) => {
  const newColor = new Array(color1.length);
  for (let i = 0; i < color1.length; i++) {
    newColor[i] = 255 * (color1[i] / 255) ** (2 * GAMMA_CONST**color2[i]);
  }
  return newColor;
};

/**
 * Scaling coefficients of saturation and luminance.
 */
const BRIGHTER_COEFF = HSL_MAXES.slice(1).map((val) => Math.sqrt(val));
/**
 * Hue = The hue of mean(leftColor, rightColor).
 * Saturation and brightness = root mean square (rms) of
 * hsl(leftColor) and hsl(rightColor). rms is more larger than mean.
 * @param color1 Numeric of a color.
 * @param color2 Numeric of a color.
 * @returns The mean value of color1 and color2.
 */
export const brighterBlend: blend = (color1, color2) => {
  const {converter, inverter} = getSpaceInfos("hsl");
  const mean = elementwiseMean(color1, color2);
  const [hue, sat, lum] = converter(mean);
  const newSat = Math.sqrt(sat) * BRIGHTER_COEFF[0];
  const newLum = Math.sqrt(lum) * BRIGHTER_COEFF[1];
  return inverter([hue, newSat, newLum]);
};

export const blendBy = {
  "mean": meanBlend,
  "brighter": brighterBlend,
  "soft light": softLightBlend,
};
