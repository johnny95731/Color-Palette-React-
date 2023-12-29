import {mod} from "./helpers";
import {ColorSpacesType} from "../../features/types/optionsType.ts";

// From RGB.
/**
 * Convert RGB to Hex.
 * @param {Array<number>} rgb RGB color array.
 * @return {String} Hex color.
 */
export const rgb2hex = (rgb: Array<number>): string => {
  let hex6 = "#";

  for (let i = 0; i < 3; i ++) {
    if (rgb[i] < 16) {
      hex6 += `0${rgb[i].toString(16)}`;
    } else {
      hex6 += rgb[i].toString(16);
    }
  }
  return hex6.toUpperCase();
};

const RGB_2_GRAY_COEFF = [0.299, 0.587, 0.114];
/**
 * Conver Hex to grayscale.
 * @param {Array<number>} rgb Array of RGB color.
 * @return {Number} grayscale
 */
export const rgb2gray = (rgb: Array<number>): number => {
  return rgb.reduce((cummul, val, i) => cummul += val * RGB_2_GRAY_COEFF[i], 0);
};

/**
 * Calculate hue (H channel of HSL/HSV) from rgb. Also, returns minimum and
 * maximum of rgb.
 * @param {Array} rgb RGB array.
 * @return {Array} [hue, min(r,g,b), max(r,g,b)].
 */
const rgb2hue = (rgb: Array<number>): Array<number> => {
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
 * Convert RGB to HSV.
 * @param {Array} rgb RGB color array.
 * @param {boolean} [toInt=true] Rounding output value to int.
 * @return {Array} [hue, sat, val].
 */
export const rgb2hsv = (
    rgb: Array<number>, toInt: boolean = true,
): Array<number> => {
  const [h, min, max] = rgb2hue(rgb);
  const s = max ? ((max - min) / max) * 255 : 0;
  if (toInt) {
    return [h, s, max].map((val)=> Math.round(val));
  } else {
    return [h, s, max];
  }
};

/**
 * Convert RGB to HSL.
 * @param {Array<number>} rgb RGB color array.
 * @param {boolean} [toInt=true] Rounding output value to int.
 * @return {Array} [hue, sat, lum]
 */
export const rgb2hsl = (
    rgb: Array<number>, toInt: boolean = true,
): Array<number> => {
  const [h, min, max] = rgb2hue(rgb);
  const l = (max + min) / 2;
  let s;
  if ((max === 0) || (max === min)) {
    s = 0;
  } else if (l <= 127.5) {
    s = 255 * (max-min) / (2*l);
  } else {
    s = 255 * (max-min) / (510-2*l);
  }
  if (toInt) {
    return [h, s, l].map((val)=> Math.round(val));
  } else {
    return [h, s, l];
  }
};

/**
 * Convert RGB to CMY.
 * @param {Array<number>} rgb RGB color array.
 * @return  {Array<number>} cmy CMY color array.
 */
export const rgb2cmy = (rgb: Array<number>): Array<number> => {
  return rgb.map((val) => 255 - val);
};


// To RGB.
/**
 * Convert HSV to RGB.
 * @param  {Array<number>} hsv HSV color array.
 * @param {boolean} [toInt=true] Rounding output value to int.
 * @return {Array<number>} RGB color array.
 */
export const hsv2rgb = (
    hsv: Array<number>, toInt: boolean = true,
): Array<number> => {
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
  let rgbPrime: Array<number>;
  if (hsv[0] < 60) rgbPrime = [C, X, 0];
  else if (hsv[0] < 120) rgbPrime = [X, C, 0];
  else if (hsv[0] < 180) rgbPrime = [0, C, X];
  else if (hsv[0] < 240) rgbPrime = [0, X, C];
  else if (hsv[0] < 300) rgbPrime = [X, 0, C];
  else rgbPrime = [C, 0, X];
  if (toInt) {
    return rgbPrime.map((val) => Math.round(255 * (val+m)));
  } else {
    return rgbPrime.map((val) => 255 * (val+m));
  }
};

/**
 * Convert HSL to RGB.
 * @param  {Array<number>} hsl HSL array.
 * @param {boolean} [toInt=true] Rounding output value to int.
 * @return {Array<number>} RGB color array.
 */
export const hsl2rgb = (
    hsl: Array<number>, toInt: boolean = true,
): Array<number> => {
  if (hsl[1] === 0) {
    return hsl.map(() => hsl[2]);
  }
  // Normalize to [0, 1].
  hsl[1] /= 255;
  hsl[2] /= 255;
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
  if (toInt) {
    return rgbPrime.map((val) => Math.round(255 * (val+m)));
  } else {
    return rgbPrime.map((val) => 255 * (val+m));
  }
};

/**
 * Convert CMY to RGB.
 * @param  {Array<number>} cmy CMY color array.
 * @return {Array<number>} RGB color array.
 */
export const cmy2rgb = (cmy: Array<number>): Array<number> => {
  return rgb2cmy(cmy);
};

/**
 * Convert Hex color to RGB color.
 * @param {String} hex Hex color string.
 * @return {Array} rgb
 */
export const hex2rgb = (hex: string): Array<number> | null => {
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


// Generators
/**
 * Generate an RGB color.
 * @return {Array<number>} [R, G, B]
 */
export const randRgbGen = (): Array<number> => {
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
  converter: (x: number[], toInt?: boolean) => number[];
  /**
   * The converter that convert specified color space to RGB space.
   * @param x specified color space values.
   * @returns RGB values.
   */
  inverter: (x: number[], toInt?: boolean) => number[];
}

/**
 * Returns infomations about color space which will be display under hex code
 * and be used in edit mode.
 * @param {String} colorMode Color space.
 * @return {ColorSpaceInfo} ColorSpaceInfo
 */
export const getModeInfos = (
    colorMode: ColorSpacesType): ColorSpaceInfo => {
  switch (colorMode) {
    case "rgb":
      return {
        labels: ["Red", "Green", "Blue"],
        maxes: [255, 255, 255],
        converter: (x: number[], toInt = true) => {
          if (toInt) return x.map((val) => Math.round(val));
          else return x;
        },
        inverter: (x: number[], toInt = true) => {
          if (toInt) return x.map((val) => Math.round(val));
          else return x;
        },
      };
    case "hsl":
      return {
        labels: ["Hue", "Saturation", "Luminance"],
        maxes: [359, 255, 255],
        converter: rgb2hsl,
        inverter: hsl2rgb,
      };
    case "hsb": // hsb = hsv
      return {
        labels: ["Hue", "Saturation", "Brightness"],
        maxes: [359, 255, 255],
        converter: rgb2hsv,
        inverter: hsv2rgb,
      };
    case "cmy":
      return {
        labels: ["Cyan", "Magenta", "Yellow"],
        maxes: [255, 255, 255],
        converter: rgb2cmy,
        inverter: cmy2rgb,
      };
    default:
      throw Error(`Invalid colorMode: ${colorMode}`);
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
