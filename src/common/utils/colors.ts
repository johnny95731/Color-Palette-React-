import {mod} from "./helpers.ts";
import {
  ColorSpacesType, spaceResolutions, getMaxesFromRes,
} from "../../features/types/optionsType.ts";

// Maximums
export const RGB_MAXES = getMaxesFromRes(spaceResolutions["rgb"]);
export const HSL_MAXES = getMaxesFromRes(spaceResolutions["hsl"]);
export const HSB_MAXES = getMaxesFromRes(spaceResolutions["hsb"]);

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
 * Calculate hue (H channel of HSL/HSV) from rgb. Also, returns minimum and
 * maximum of rgb.
 * @param {number[]} rgb RGB array.
 * @return {number[]} [hue, min(r,g,b), max(r,g,b)].
 */
const rgb2hue = (rgb: number[]): number[] => {
  const [r, g, b] = rgb;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  let h;
  switch (max) {
    case min:
      h = 0;
      break;
    case r:
      h = 60 * mod(((g - b) / delta), 6);
      break;
    case g:
      h = ((b-r) / delta + 2) * 60;
      break;
    default: // case b:
      h = ((r-g) / delta + 4) * 60;
  }
  return [h, min, max];
};

/**
 * Convert RGB to HSL.
 * @param {number[]} rgb RGB color array.
 * @return {number[]} [hue, sat, lum]
 */
export const rgb2hsl = (rgb: number[]): number[] => {
  const [h, min, max] = rgb2hue(rgb);
  const l = (max + min) / 2;
  let s;
  if ((max === 0) || (max === min)) {
    s = 0;
  } else if (l <= 127.5) {
    s = HSL_MAXES[1] * (max - min) / (2 * l);
  } else {
    s = HSL_MAXES[1] * (max - min) / (510 - 2 * l);
  }
  return [h, s, l];
};

/**
 * Convert RGB to HSB.
 * @param {number[]} rgb RGB color array.
 * @return {number[]} [hue, sat, brightness].
 */
export const rgb2hsb = (rgb: number[]): number[] => {
  const [h, min, max] = rgb2hue(rgb);
  const s = max ? ((max - min) / max) * HSB_MAXES[1] : 0;
  return [h, s, max];
};

/**
 * Convert RGB to CMY.
 * @param {number[]} rgb RGB color array.
 * @return  {number[]} cmy CMY color array.
 */
export const rgb2cmy = (rgb: number[]): number[] => {
  return rgb.map((val, i) => RGB_MAXES[i] - val);
};


// To RGB.
/**
 * Convert HSV to RGB.
 * @param  {number[]} hsv HSV color array.
 * @return {number[]} RGB color array.
 */
export const hsv2rgb = (hsv: number[]): number[] => {
  if (hsv[1] === 0) {
    return hsv.map(() => hsv[2]);
  }
  // Normalize to [0, 1].
  hsv[1] /= 255;
  hsv[2] /= 255;
  // Consts
  const C = hsv[1] * hsv[2];
  const X = C * (1 - Math.abs((hsv[0]/60)%2 - 1));
  const m = hsv[2] - C;
  // Convert. (Note: The formula can reduce.)
  let rgbPrime: number[];
  if (hsv[0] < 60) rgbPrime = [C, X, 0];
  else if (hsv[0] < 120) rgbPrime = [X, C, 0];
  else if (hsv[0] < 180) rgbPrime = [0, C, X];
  else if (hsv[0] < 240) rgbPrime = [0, X, C];
  else if (hsv[0] < 300) rgbPrime = [X, 0, C];
  else rgbPrime = [C, 0, X];
  return rgbPrime.map((val) => 255 * (val+m));
};

/**
 * Convert HSL to RGB.
 * @param  {number[]} hsl HSL array.
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
  const C = (1 - Math.abs(2*hsl[2] - 1)) * hsl[1];
  const X = C * (1 - Math.abs((hsl[0]/60) % 2 - 1));
  const m = hsl[2] - C/2;
  // Convert (Note: The formula can reduce.)
  let rgbPrime;
  if (hsl[0] < 60) rgbPrime = [C, X, 0];
  else if (hsl[0] < 120) rgbPrime = [X, C, 0];
  else if (hsl[0] < 180) rgbPrime = [0, C, X];
  else if (hsl[0] < 240) rgbPrime = [0, X, C];
  else if (hsl[0] < 300) rgbPrime = [X, 0, C];
  else rgbPrime = [C, 0, X];
  return rgbPrime.map((val, i) => RGB_MAXES[i] * (val + m));
};

/**
 * Convert CMY to RGB.
 * @param  {number[]} cmy CMY color array.
 * @return {number[]} RGB color array.
 */
export const cmy2rgb = (cmy: number[]): number[] => {
  return rgb2cmy(cmy);
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
  else return false;
  const nonHex = hex.match(/[^0-9A-F]/i);
  if ((nonHex !== null) || (![3, 6].includes(hex.length))) return false;
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
    rgb[i] = Math.floor(Math.random() * 256);
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
    case "rgb":
      infos = {
        labels: ["Red", "Green", "Blue"],
        converter: (x: number[]) => x,
        inverter: (x: number[]) => x,
      };
      break;
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
        inverter: hsv2rgb,
      };
      break;
    case "cmy":
      infos = {
        labels: ["Cyan", "Magenta", "Yellow"],
        converter: rgb2cmy,
        inverter: cmy2rgb,
      };
      break;
  }
  infos.maxes = getMaxesFromRes(spaceResolutions[space]);
  return infos as ColorSpaceInfo;
};
