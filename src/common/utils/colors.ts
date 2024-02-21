import {clip, dot, identity, mod, round, toPercent} from "./helpers.ts";
import {
  RGB_MAXES, HSL_MAXES, HSB_MAXES, CMY_MAXES, CMYK_MAXES, XYZ_MAXES,
} from "@/common/utils/constants.ts";
import type {ColorSpaceInfos, ColorSpaceTrans} from "types/utilTypes.ts";
import type {ColorSpacesType} from "types/pltType.ts";

// From RGB.
/**
 * Convert RGB to Hex.
 * @param {number[]} rgb RGB color array.
 * @return {String} Hex color.
 */
export const rgb2hex = (rgb: number[]): string => {
  let hex6 = "#";
  for (let i = 0; i < 3; i ++) {
    const int = Math.floor(rgb[i]);
    hex6 += int < 16 ? `0${int.toString(16)}` : int.toString(16);
  }
  return hex6.toUpperCase();
};

const RGB_2_GRAY_COEFF = [0.299, 0.587, 0.114];
/**
 * Conver Hex to grayscale.
 * @param {number[]} rgb Array of RGB color.
 * @return {Number} grayscale
 */
export const rgb2gray = (rgb: number[]): number => {
  return rgb.reduce((cummul, val, i) => cummul += val * RGB_2_GRAY_COEFF[i], 0);
};


/**
 * Calculate hue (H channel of HSL/HSB) from rgb. Also, returns minimum and
 * maximum of rgb.
 * @param {number[]} rgb RGB array.
 * @return {number[]} [hue, min(r,g,b), max(r,g,b)].
 */
const rgb2hue = (rgb: number[]): number[] => {
  const [r, g, b] = rgb;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  let hue;
  switch (max) {
    case min:
      hue = 0;
      break;
    case r:
      hue = mod(((g - b) / delta), 6);
      break;
    case g:
      hue = (b - r) / delta + 2;
      break;
    default: // case b:
      hue = (r - g) / delta + 4;
  }
  return [60 * hue, min, max];
};

/**
 * Convert RGB to HSL.
 * @param {number[]} rgb RGB color array.
 * @return {number[]} [hue, sat, lum]
 */
export const rgb2hsl = (rgb: number[]): number[] => {
  const [hue, min, max] = rgb2hue(rgb);
  const lum = (max + min) / (2 * RGB_MAXES);
  let sat = 0;
  if (max !== min) {
    sat = (max - min) / (1 - Math.abs(2 * lum - 1)) / RGB_MAXES;
  }
  return [hue, HSL_MAXES[1] * sat, HSL_MAXES[2] * lum];
};

/**
 * Convert RGB to HSB.
 * @param {number[]} rgb RGB color array.
 * @return {number[]} [hue, sat, brightness].
 */
export const rgb2hsb = (rgb: number[]): number[] => {
  const [hue, min, max] = rgb2hue(rgb);
  const sat = max ? ((max - min) / max) : 0;
  const bri = max / RGB_MAXES;
  return [hue, HSB_MAXES[1] * sat, HSB_MAXES[2] * bri];
};

/**
 * Convert RGB to CMY.
 * @param {number[]} rgb RGB color array.
 * @return {number[]} CMYK color array.
 */
export const rgb2cmy = (rgb: number[]): number[] => {
  const rgbMax = Math.max(...rgb);
  // Tolerance = 0.5. <input(range)> have decimals.
  if (rgbMax < 0.5) return [CMY_MAXES, CMY_MAXES, CMY_MAXES];
  const scalingCoeff = CMY_MAXES / RGB_MAXES;
  const cmy = rgb.map((val) => (RGB_MAXES - val) * scalingCoeff);
  return cmy;
};

/**
 * Convert RGB to CMYK.
 * @param {number[]} rgb RGB color array.
 * @return {number[]} CMYK color array.
 */
export const rgb2cmyk = (rgb: number[]): number[] => {
  const k = (RGB_MAXES - Math.max(...rgb)); // k in [0, RGB_MAXES].
  // Tolerance = 0.5. <input(range)> have decimals.
  if (CMYK_MAXES - k < 0.5) return [0, 0, 0, CMYK_MAXES];
  const kConst = CMYK_MAXES / (RGB_MAXES - k); // Scaling to [0, CMYK_MAXES].
  const cmy = rgb.map((val) => (RGB_MAXES - val - k) * kConst);
  cmy.push(k * (CMYK_MAXES / RGB_MAXES));
  return cmy;
};

const RGB2XYZ_COEFF = [
  [0.4124, 0.3576, 0.1805],
  [0.2126, 0.7152, 0.0722],
  [0.0193, 0.1192, 0.9505],
];
/**
 * Convert RGB to CIE XYZ.
 * @param {number[]} rgb RGB color array.
 * @return {number[]} CIE XYZ color array.
 */
export const rgb2xyz = (rgb: number[]): number[] => {
  const linearRgb = rgb.map((val) => {
    const std = val / RGB_MAXES;
    return std > 0.04045 ? ((std+0.055)/1.055)**2.4 : std / 12.92;
  });
  const arr = RGB2XYZ_COEFF.map((row) => dot(row, linearRgb) * XYZ_MAXES);
  return arr;
};


// To RGB.
/**
 * Convert HSB to RGB.
 * @param {number[]} hsb HSB color array.
 * @return {number[]} RGB color array.
 */
export const hsb2rgb = (hsb: number[]): number[] => {
  if (hsb[1] === 0) {
    return hsb.map(() => hsb[2] / HSB_MAXES[2] * RGB_MAXES);
  }
  const temp = [...hsb];
  // Normalize to [0, 1].
  temp[1] /= HSB_MAXES[1];
  temp[2] /= HSB_MAXES[2];
  // Consts
  const C = temp[1] * temp[2];
  const X = C * (1 - Math.abs((temp[0]/60) % 2 - 1));
  const m = temp[2] - C;
  // Convert. (Note: The formula can reduce.)
  let rgbPrime: number[];
  if (temp[0] < 60) rgbPrime = [C, X, 0];
  else if (temp[0] < 120) rgbPrime = [X, C, 0];
  else if (temp[0] < 180) rgbPrime = [0, C, X];
  else if (temp[0] < 240) rgbPrime = [0, X, C];
  else if (temp[0] < 300) rgbPrime = [X, 0, C];
  else rgbPrime = [C, 0, X];
  return rgbPrime.map((val) => round(RGB_MAXES * (val + m), 2));
};

/**
 * Convert HSL to RGB.
 * @param {number[]} hsl HSL array.
 * @return {number[]} RGB color array.
 */
export const hsl2rgb = (hsl: number[]): number[] => {
  if (hsl[1] === 0) {
    return hsl.map(() => hsl[2] / HSB_MAXES[2] * RGB_MAXES);
  }
  const temp = [...hsl];
  // Normalize to [0, 1].
  temp[1] /= HSL_MAXES[1];
  temp[2] /= HSL_MAXES[2];
  // Consts
  const C = (1 - Math.abs(2 * temp[2] - 1)) * temp[1];
  const X = C * (1 - Math.abs((temp[0] / 60) % 2 - 1));
  const m = temp[2] - C / 2;
  // Convert (Note: The formula can reduce.)
  let rgbPrime;
  if (temp[0] < 60) rgbPrime = [C, X, 0];
  else if (temp[0] < 120) rgbPrime = [X, C, 0];
  else if (temp[0] < 180) rgbPrime = [0, C, X];
  else if (temp[0] < 240) rgbPrime = [0, X, C];
  else if (temp[0] < 300) rgbPrime = [X, 0, C];
  else rgbPrime = [C, 0, X];
  return rgbPrime.map((val) => round(RGB_MAXES * (val + m), 2));
};

/**
 * Convert CMY to RGB.
 * @param {number[]} cmyk CMY color array.
 * @return {number[]} RGB color array.
 */
export const cmy2rgb = (cmy: number[]): number[] => {
  const scalingCoeff = RGB_MAXES / CMY_MAXES;
  const rgb = cmy.map((val) => RGB_MAXES - val * scalingCoeff);
  return rgb;
};

/**
 * Convert CMYK to RGB.
 * @param {number[]} cmyk CMYK color array.
 * @return {number[]} RGB color array.
 */
export const cmyk2rgb = (cmyk: number[]): number[] => {
  // K = 100%.
  if (CMYK_MAXES - cmyk[3] < 0.5) return [0, 0, 0];
  // Const relate to k.
  const kConst = (RGB_MAXES / CMYK_MAXES) * (CMYK_MAXES - cmyk[3]);
  const rgb = Array.from(
      {length: 3}, (_, i) => kConst * (1 - cmyk[i] / CMYK_MAXES),
  );
  return rgb;
};

const XYZ2RGB_COEFF = [
  [3.2406, -1.5372, -0.4986],
  [-0.9689, 1.8758, 0.0415],
  [0.0557, -0.2040, 1.0570],
] as const;
/**
 * Convert CIE XYZ to RGB.
 * @param {number[]} xyz RGB color array.
 * @return {number[]} RGB color array.
 */
export const xyz2rgb = (xyz: number[]): number[] => {
  return XYZ2RGB_COEFF.map((row) => {
    const linearRgb = dot(row, xyz) / XYZ_MAXES;
    const rgb = linearRgb > 0.0031308 ?
        1.055 * linearRgb**(1/2.4) - 0.055 :
        12.92 * linearRgb;
    return clip(rgb * RGB_MAXES, 0, RGB_MAXES);
  });
};

/**
 * Convert Hex color to RGB color.
 * @param {String} hex Hex color string.
 * @return {number[]} rgb
 */
export const hex2rgb = (hex: string): number[] => {
  hex = hex.replace(/[^0-9A-F]/ig, "");
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }
  const num = parseInt(hex, 16);
  return [num >> 16, (num >> 8) & 255, num & 255];
};

// Validator
/**
 * Verify the string whether is a (3 channel, no alpha channel) Hex color.
 * @param {String} str String that need to be verified.
 * @return {Boolean} Validity of string.
 */
export const isValidHex = (str: string): boolean => {
  if (typeof str !== "string") return false;
  if (str.startsWith("#")) str = str.slice(1);
  if (![3, 6].includes(str.length)) return false;
  const nonHex = str.match(/[^0-9A-F]/i);
  if (nonHex !== null) return false;
  return true;
};

/**
 * Returns informations about color space which will be display under hex code
 * and be used in edit mode.
 * @param {String} space Color space.
 * @return {ColorSpaceInfos} ColorSpaceInfo
 */
export const getSpaceInfos = (space: ColorSpacesType): ColorSpaceInfos => {
  switch (space) {
    case "hsl":
      return {
        labels: ["Hue", "Saturation", "Luminance"],
        maxes: [...HSL_MAXES],
      };
    case "hsb": // hsb = hsv
      return {
        labels: ["Hue", "Saturation", "Brightness"],
        maxes: [...HSB_MAXES],
      };
    case "cmy":
      return {
        labels: ["Cyan", "Magenta", "Yellow"],
        maxes: [CMY_MAXES, CMY_MAXES, CMY_MAXES],
      };
    case "cmyk":
      return {
        labels: ["Cyan", "Magenta", "Yellow", "Black"],
        maxes: [CMYK_MAXES, CMYK_MAXES, CMYK_MAXES, CMYK_MAXES],
      };
    case "xyz":
      return {
        labels: ["x", "y", "z"],
        maxes: [XYZ_MAXES, XYZ_MAXES, XYZ_MAXES],
      };
    default: // "rgb" and "name"
      return {
        labels: ["Red", "Green", "Blue"],
        maxes: [RGB_MAXES, RGB_MAXES, RGB_MAXES],
      };
  }
};
export const getSpaceTrans = (space: ColorSpacesType): ColorSpaceTrans => {
  switch (space) {
    case "hsl":
      return {
        converter: rgb2hsl,
        inverter: hsl2rgb,
      };
    case "hsb": // hsb = hsv
      return {
        converter: rgb2hsb,
        inverter: hsb2rgb,
      };
    case "cmy":
      return {
        converter: rgb2cmy,
        inverter: cmy2rgb,
      };
    case "cmyk":
      return {
        converter: rgb2cmyk,
        inverter: cmyk2rgb,
      };
    case "xyz":
      return {
        converter: rgb2xyz,
        inverter: xyz2rgb,
      };
    default: // "rgb" and "name"
      return {
        converter: identity,
        inverter: identity,
      };
  }
};


// Generators
/**
 * Generate an RGB color.
 * @return {number[]} [R, G, B]
 */
export const randRgbGen = (): number[] => {
  const rgb = new Array(3);
  for (let i = 0; i < 3; i ++) {
    rgb[i] = Math.floor(Math.random() * (RGB_MAXES + 1));
  }
  return rgb;
};

/**
 * Generate a linear gradient along an axis for a given color and space.
 */
export const gradientGen = (
    colors: number[], axis: number, space: ColorSpacesType,
) => {
  const {inverter} = getSpaceTrans(space);
  const {maxes} = getSpaceInfos(space);
  const gradLength = Math.ceil(maxes[axis] / 8);
  const grads: string[] = [];
  const arr = [...colors];
  for (let j = 0; j < gradLength; j++) {
    arr.splice(axis, 1, j * 8);
    grads.push(`${rgb2hex(inverter(arr))} ${toPercent(j/gradLength)}%`);
  }
  return `linear-gradient(90deg, ${grads.join(", ")})`;
};


// Adjusts contrast.
/**
 * Scale ths values of RGB.
 * @param {number[][]} rgbs RGB arrays.
 * @param {number} c Scaling coefficient.
 * @returns {number[][]} `rgb` after scaling.
 */
export const scaling = (rgbs: number[][], c: number): typeof rgbs => {
  for (let i = 0; i < rgbs.length; i++) {
    for (let j = 0; j < rgbs[i].length; j++) {
      rgbs[i][j] = rgbs[i][j] * c > RGB_MAXES ? RGB_MAXES : rgbs[i][j] * c;
    }
  }
  return rgbs;
};

/**
 * Gamma correction to RGB array(s).
 * @param {number[] | number[][]} rgb RGB array(s).
 * @param {number} gamma Gamma coefficient.
 * @returns {number[] | number[][]} `rgb` after correction. The type is the
 * same as `rgb`.
 */
export const gammaCorrection = (
    rgb: number[] | number[][], gamma: number,
): typeof rgb => {
  if (typeof rgb[0] === "number") {
    const normalizeCoeff = RGB_MAXES ** (1 - gamma);
    return (rgb as number[]).map((val) => normalizeCoeff * (val ** gamma));
  } else {
    return (rgb as number[][]).map(
        (arr) => gammaCorrection(arr, gamma) as number[],
    );
  }
};
