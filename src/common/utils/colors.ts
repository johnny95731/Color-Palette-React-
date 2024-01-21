import {mod} from "./helpers.ts";
import {SPACE_MAXES} from "@/common/utils/constants.ts";
import type {ColorSpacesType} from "types/optionsType.ts";

// Maximums
export const RGB_MAXES = SPACE_MAXES["rgb"];
export const HSL_MAXES = SPACE_MAXES["hsl"];
export const HSB_MAXES = SPACE_MAXES["hsb"];
const CMY_MAXES = SPACE_MAXES["cmy"];
const CMYK_MAXES = SPACE_MAXES["cmyk"];

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
  const [Hue, min, max] = rgb2hue(rgb);
  const lPrime = max + min;
  let sat;
  if ((max === 0)) {
    sat = 0;
  } else if (lPrime <= (RGB_MAXES / 2)) {
    sat = HSL_MAXES[1] * (max - min) / (2 * lPrime);
  } else {
    sat = HSL_MAXES[1] * (max - min) / (2 * (RGB_MAXES - lPrime));
  }
  return [Hue, sat, lPrime / 2];
};

/**
 * Convert RGB to HSB.
 * @param {number[]} rgb RGB color array.
 * @return {number[]} [hue, sat, brightness].
 */
export const rgb2hsb = (rgb: number[]): number[] => {
  const [hue, min, max] = rgb2hue(rgb);
  const sat = max ? HSB_MAXES[1] * ((max - min) / max) : 0;
  return [hue, sat, max];
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


// To RGB.
/**
 * Convert HSB to RGB.
 * @param {number[]} hsb HSB color array.
 * @return {number[]} RGB color array.
 */
export const hsb2rgb = (hsb: number[]): number[] => {
  if (hsb[1] === 0) {
    return hsb.map(() => hsb[2]);
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
  return rgbPrime.map((val) => RGB_MAXES * (val + m));
};

/**
 * Convert HSL to RGB.
 * @param {number[]} hsl HSL array.
 * @return {number[]} RGB color array.
 */
export const hsl2rgb = (hsl: number[]): number[] => {
  if (hsl[1] === 0) {
    return hsl.map(() => hsl[2]);
  }
  // Normalize to [0, 1].
  hsl[1] /= HSL_MAXES[1];
  hsl[2] /= HSL_MAXES[2];
  // Consts
  const C = (1 - Math.abs(2 * hsl[2] - 1)) * hsl[1];
  const X = C * (1 - Math.abs((hsl[0] / 60) % 2 - 1));
  const m = hsl[2] - C / 2;
  // Convert (Note: The formula can reduce.)
  let rgbPrime;
  if (hsl[0] < 60) rgbPrime = [C, X, 0];
  else if (hsl[0] < 120) rgbPrime = [X, C, 0];
  else if (hsl[0] < 180) rgbPrime = [0, C, X];
  else if (hsl[0] < 240) rgbPrime = [0, X, C];
  else if (hsl[0] < 300) rgbPrime = [X, 0, C];
  else rgbPrime = [C, 0, X];
  return rgbPrime.map((val) => RGB_MAXES * (val + m));
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

/**
 * Convert Hex color to RGB color.
 * @param {String} hex Hex color string.
 * @return {number[]} rgb
 */
export const hex2rgb = (hex: string): number[] | null => {
  if (hex.startsWith("#")) {
    hex = hex.slice(1);
  }
  const nonHex = hex.replace(/[^0-9A-F]/ig, "");
  if ((!nonHex.length)) return null; // All words are not hex.
  switch (hex.length) {
    case 3:
      return hex.split("").map((str) => parseInt(str+str, 16));
    case 6:
      return [
        parseInt(hex.slice(0, 2), 16),
        parseInt(hex.slice(2, 4), 16),
        parseInt(hex.slice(4, 6), 16),
      ];
    default:
      return null;
  }
};

// Validator
/**
 * Verify the string whether is a (3 channel, no alpha channel) Hex color.
 * @param {String} hex String that need to be verified.
 * @return {Boolean} Validity of string.
 */
export const isValidHex = (hex: string): boolean => {
  if (typeof hex !== "string") return false;
  if (hex.startsWith("#")) hex = hex.slice(1);
  if (![3, 6].includes(hex.length)) return false;
  const nonHex = hex.match(/[^0-9A-F]/i);
  if ((nonHex !== null)) return false;
  return true;
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
 * Infomations about color space which will be used in edit mode.
 */
type ColorSpaceInfo = {
  /**
   * Name of channels
   */
  labels: string[];
  /**
   * Maximum of intervals of each channels
   */
  maxes: number[];
  /**
   * The converter that convert RGB space to specified color space.
   * @param x RGB values.
   * @returns specified color space values.
   */
  converter: (x: number[]) => number[];
  /**
   * The converter that convert specified color space to RGB space.
   * @param x specified color space values.
   * @returns RGB values.
   */
  inverter: (x: number[]) => number[];
}

/**
 * Returns infomations about color space which will be display under hex code
 * and be used in edit mode.
 * @param {String} space Color space.
 * @return {ColorSpaceInfo} ColorSpaceInfo
 */
export const getSpaceInfos = (space: ColorSpacesType): ColorSpaceInfo => {
  let infos: {[key: string]: any};
  switch (space) {
    case "hsl":
      infos = {
        labels: ["Hue", "Saturation", "Luminance"],
        converter: rgb2hsl,
        inverter: hsl2rgb,
      };
      break;
    case "hsb": // hsb = hsv
      infos = {
        labels: ["Hue", "Saturation", "Brightness"],
        converter: rgb2hsb,
        inverter: hsb2rgb,
      };
      break;
    case "cmy":
      infos = {
        labels: ["Cyan", "Magenta", "Yellow"],
        converter: rgb2cmy,
        inverter: cmy2rgb,
      };
      break;
    case "cmyk":
      infos = {
        labels: ["Cyan", "Magenta", "Yellow", "Black"],
        converter: rgb2cmyk,
        inverter: cmyk2rgb,
      };
      break;
    default: // "rgb" and "name"
      infos = {
        labels: ["Red", "Green", "Blue"],
        converter: (x: number[]) => Array.from(x),
        inverter: (x: number[]) => Array.from(x),
      };
      break;
  }
  const maxes = SPACE_MAXES[space];
  infos.maxes = (
    typeof maxes === "number" ?
        infos.labels.map(() => maxes) :
        SPACE_MAXES[space]
  );
  return infos as ColorSpaceInfo;
};
