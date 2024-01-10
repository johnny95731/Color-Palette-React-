import {mod} from "./helpers.ts";
import {
  ColorSpacesType, spaceMaxes,
} from "../../features/types/optionsType.ts";

// Maximums
export const RGB_MAXES = spaceMaxes["rgb"];
export const HSL_MAXES = spaceMaxes["hsl"];
export const HSB_MAXES = spaceMaxes["hsb"];
const CMYK_MAXES = spaceMaxes["cmyk"];

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
  } else if (l <= (RGB_MAXES / 2)) {
    s = HSL_MAXES[1] * (max - min) / (2 * l);
  } else {
    s = HSL_MAXES[1] * (max - min) / (2 * (RGB_MAXES - l));
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
 * Convert RGB to CMYK.
 * @param {number[]} rgb RGB color array.
 * @return  {number[]} CMYK color array.
 */
export const rgb2cmyk = (rgb: number[]): number[] => {
  const k: number = (RGB_MAXES - Math.max(...rgb));
  if (Math.abs(RGB_MAXES - k) < 0.5) return [0, 0, 0, 100];
  const kConst = CMYK_MAXES / (RGB_MAXES - k); // Const relate to k.
  const cmy = rgb.map((val) => (RGB_MAXES - val - k) * kConst);
  return [...cmy, k * (CMYK_MAXES / RGB_MAXES)];
};


// To RGB.
/**
 * Convert HSB to RGB.
 * @param  {number[]} hsb HSB color array.
 * @return {number[]} RGB color array.
 */
export const hsb2rgb = (hsb: number[]): number[] => {
  if (hsb[1] === 0) {
    return hsb.map(() => hsb[2]);
  }
  // Normalize to [0, 1].
  hsb[1] /= HSB_MAXES[1];
  hsb[2] /= HSB_MAXES[2];
  // Consts
  const C = hsb[1] * hsb[2];
  const X = C * (1 - Math.abs((hsb[0]/60)%2 - 1));
  const m = hsb[2] - C;
  // Convert. (Note: The formula can reduce.)
  let rgbPrime: number[];
  if (hsb[0] < 60) rgbPrime = [C, X, 0];
  else if (hsb[0] < 120) rgbPrime = [X, C, 0];
  else if (hsb[0] < 180) rgbPrime = [0, C, X];
  else if (hsb[0] < 240) rgbPrime = [0, X, C];
  else if (hsb[0] < 300) rgbPrime = [X, 0, C];
  else rgbPrime = [C, 0, X];
  return rgbPrime.map((val) => RGB_MAXES * (val+m));
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
 * Convert RGB to CMYK.
 * @param {number[]} cmyk RGB color array.
 * @return  {number[]} CMYK color array.
 */
export const cmyk2rgb = (cmyk: number[]): number[] => {
  // K = 100%.
  if (Math.abs(cmyk[3] - CMYK_MAXES) < 0.5) return [0, 0, 0];
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
        converter: (x: number[]) => Array.from(x),
        inverter: (x: number[]) => Array.from(x),
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
        inverter: hsb2rgb,
      };
      break;
    case "cmyk":
      infos = {
        labels: ["Cyan", "Magenta", "Yellow", "Black"],
        converter: rgb2cmyk,
        inverter: cmyk2rgb,
      };
      break;
  }
  const maxes = spaceMaxes[space];
  infos.maxes = (
    typeof maxes === "number" ?
        infos.labels.map(() => maxes) :
        spaceMaxes[space]
  );
  return infos as ColorSpaceInfo;
};
