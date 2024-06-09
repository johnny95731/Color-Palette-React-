import { clip, dot, identity, mod, round, toPercent } from './helpers.ts';
import {
  RGB_MAXES, HSL_MAXES, HSB_MAXES, CMY_MAXES, CMYK_MAXES, XYZ_MAXES, LAB_MAXES,
} from './constants.ts';
import NAMED_COLORS from './named-color.json';
import type { ColorSpaceInfos, ColorSpaceTrans } from 'types/utilTypes.ts';
import type { ColorSpacesType } from 'types/pltType.ts';


export const namedColors = {
  /**
   * All names of CSS <named-color> (removed synonym name) with sapce between words.
   */
  fullNames: NAMED_COLORS.map(
    ({ name }) => name.replace(/([A-Z])/g, ' $1').trim()
  ),
  /**
   * Find the closet named-color's index.
   */
  getClosestIdx(rgb: number[]): number {
    let minDist = Infinity;
    let dist: number;
    // `minDist` is init to be `Infinity`. Thus `name` will be assigned value.
    let closestIdx: number = 0;
    for (let i = 0; i < NAMED_COLORS.length; i++) {
      const {value} = NAMED_COLORS[i];
      // No need to take square root since we do not need the actual distance.
      dist = 0;
      for (let i = 0; i < 3; i++) {
        dist += (rgb[i] - value[i])**2;
      }

      // Min dist between two named-color is about 4.24.
      if (dist < 8.98) return i; // about (4.24**2) / 2 = 8.9888
      if (dist < minDist) {
        closestIdx = i;
        minDist = dist;
      }
    }
    return closestIdx;
  },
  /**
   * Get rgb values of CSS <named-color> by index of .json file
   */
  getRgb(idx: number) {
    return NAMED_COLORS[idx].value;
  }
};

// LAB
const LAB_DELTA = 6 / 29;
/**
 * Function that be used in the transformation of CIE XYZ to CIE LAB.
 * The function maps [0, 1] into [4/29, 1]
 */
const labFunc = (val: number): number => {
  return val > LAB_DELTA ** 3 ?
  val ** (1/3) :
  val / (3 * LAB_DELTA**2) + 4 / 29;
  // `4 / 29` is chosen for making the minimum of L (in LAB) equals 0.
};
/**
 * Function that be used in the transformation of CIE LAB to CIE XYZ.
 * The function maps [4/29, 1] into [0, 1]
 */
const labFuncInv = (val: number) => {
  return val > LAB_DELTA ?
    val ** 3 :
    (3 * LAB_DELTA**2) * (val - 4 / 29);
};

/**
 * Convert CIE XYZ to CIE LAB.
 * @param xyz CIE XYZ color array.
 * @return CIE LAB color array.
 */
const xyz2lab = (xyz: number[]): number[] => {
  const fValue = xyz.map(val => labFunc(val / XYZ_MAXES)); // range: [4/29, 1]
  const L = clip(116 * fValue[1] - 16, 0, LAB_MAXES[0]); // clip to avoid floating issue.
  // labFunc(i) - labFunc(b) in [-25/29, 25/29].
  // multiply `145 = 29 * 5` for scaling to [-125, 125].
  const a = clip(145 * (fValue[0] - fValue[1]), ...LAB_MAXES[1]);
  const b = clip(145 * (fValue[1] - fValue[2]), ...LAB_MAXES[2]);
  return [L, a, b];
};

/**
 * Convert CIE LAB to CIE XYZ (scaling to `XYZ_MAXES`)
 * @param lab CIE XYZ color array.
 * @return CIE LAB color array.
 */
const lab2xyz = (lab: number[]): number[] => {
  const pre = [ // preprocessing
    (lab[0] + 16) / 116,
    lab[1] / 145,
    lab[2] / 145
  ];
  return [ // values in labFuncInv is variable `fValue` in function `xyz2lab`.
    labFuncInv(pre[0] + pre[1]),
    labFuncInv(pre[0]),
    labFuncInv(pre[0] - pre[2]),
  ].map(val => val * XYZ_MAXES);
};


// From RGB.
/**
 * Convert RGB to Hex.
 * @param rgb RGB color array.
 * @return Hex color.
 */
export const rgb2hex = (rgb: number[]): string => {
  let hex6 = '#';
  for (let i = 0; i < 3; i ++) {
    const int = Math.floor(rgb[i]);
    hex6 += int < 16 ? `0${int.toString(16)}` : int.toString(16);
  }
  return hex6.toUpperCase();
};

const RGB_2_GRAY_COEFF = [0.299, 0.587, 0.114];
/**
 * Conver Hex to grayscale.
 * @param rgb Array of RGB color.
 * @return grayscale
 */
export const rgb2gray = (rgb: number[]): number => {
  return rgb.reduce((cummul, val, i) => cummul += val * RGB_2_GRAY_COEFF[i], 0);
};


/**
 * Calculate hue (H channel of HSL/HSB) from rgb. Also, returns minimum and
 * maximum of rgb.
 * @param rgb RGB array.
 * @return [hue, min(r,g,b), max(r,g,b)].
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
 * @param rgb RGB color array.
 * @return [hue, sat, lum]
 */
const rgb2hsl = (rgb: number[]): number[] => {
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
 * @param rgb RGB color array.
 * @return [hue, sat, brightness].
 */
const rgb2hsb = (rgb: number[]): number[] => {
  const [hue, min, max] = rgb2hue(rgb);
  const sat = max ? ((max - min) / max) : 0;
  const bri = max / RGB_MAXES;
  return [hue, HSB_MAXES[1] * sat, HSB_MAXES[2] * bri];
};

/**
 * Convert RGB to CMY.
 * @param rgb RGB color array.
 * @return CMYK color array.
 */
const rgb2cmy = (rgb: number[]): number[] => {
  const rgbMax = Math.max(...rgb);
  // Tolerance = 0.5. <input(range)> have decimals.
  if (rgbMax < 0.5) return [CMY_MAXES, CMY_MAXES, CMY_MAXES];
  const scalingCoeff = CMY_MAXES / RGB_MAXES;
  const cmy = rgb.map((val) => (RGB_MAXES - val) * scalingCoeff);
  return cmy;
};

/**
 * Convert RGB to CMYK.
 * @param rgb RGB color array.
 * @return CMYK color array.
 */
const rgb2cmyk = (rgb: number[]): number[] => {
  const k = (RGB_MAXES - Math.max(...rgb)); // k in [0, RGB_MAXES].
  // Tolerance = 0.5. <input(range)> have decimals.
  if (CMYK_MAXES - CMYK_MAXES * k / RGB_MAXES < 0.5) {
    return [0, 0, 0, CMYK_MAXES];
  }
  const kConst = CMYK_MAXES / (RGB_MAXES - k); // Scaling to [0, CMYK_MAXES].
  const cmy = rgb.map((val) => (RGB_MAXES - val - k) * kConst);
  cmy.push(k * (CMYK_MAXES / RGB_MAXES));
  return cmy;
};

/**
 * sRGB to XYZ. Reference White: D65.
 */
const RGB2XYZ_COEFF = [
  [0.4124564, 0.3575761, 0.1804375],
  [0.2126729, 0.7151522, 0.0721750],
  [0.0193339, 0.1191920, 0.9503041],
] as const;
// 
/**
 * For normalize XYZ to same maximum.
 * Sum of each row may not be 1.
 */
const RGB2XYZ_COEFF_ROW_SUM = RGB2XYZ_COEFF.map(row => row[0] + row[1] + row[2]);
/**
 * Convert RGB to CIE XYZ.
 * @param rgb RGB color array.
 * @return CIE XYZ color array. The result will be scaling to [0, 100]
 */
const rgb2xyz = (rgb: number[]): number[] => {
  const scalingCoeff = RGB2XYZ_COEFF_ROW_SUM.map(val => XYZ_MAXES / (RGB_MAXES * val));
  return RGB2XYZ_COEFF.map((row, i) => {
    return dot(row, rgb) * scalingCoeff[i];
  });
};

/**
 * Convert RGB to CIE LAB.
 * @param rgb RGB color array.
 * @return CIE LAB color array.
 */
const rgb2lab = (rgb: number[]): number[] => {
  return xyz2lab(rgb2xyz(rgb));
};


// To RGB.
/**
 * Convert HSB to RGB.
 * @param hsb HSB color array.
 * @return RGB color array.
 */
const hsb2rgb = (hsb: number[]): number[] => {
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
 * @param hsl HSL array.
 * @return RGB color array.
 */
const hsl2rgb = (hsl: number[]): number[] => {
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
 * @param cmyk CMY color array.
 * @return RGB color array.
 */
const cmy2rgb = (cmy: number[]): number[] => {
  const scalingCoeff = RGB_MAXES / CMY_MAXES;
  const rgb = cmy.map((val) => RGB_MAXES - val * scalingCoeff);
  return rgb;
};

/**
 * Convert CMYK to RGB.
 * @param cmyk CMYK color array.
 * @return RGB color array.
 */
const cmyk2rgb = (cmyk: number[]): number[] => {
  // K = 100%.
  if (CMYK_MAXES - cmyk[3] < 0.5) return [0, 0, 0];
  // Const relate to k.
  const kConst = (RGB_MAXES / CMYK_MAXES) * (CMYK_MAXES - cmyk[3]);
  const rgb = Array.from(
      { length: 3 }, (_, i) => kConst * (1 - cmyk[i] / CMYK_MAXES),
  );
  return rgb;
};

const XYZ2RGB_COEFF = [
  [3.2404542, -1.5371385, -0.4985314],
  [-0.9692660, 1.8760108, 0.0415560],
  [0.0556434, -0.2040259, 1.0572252],
] as const;
/**
 * Convert CIE XYZ to RGB.
 * @param xyz RGB color array.
 * @return RGB color array.
 */
const xyz2rgb = (xyz: number[]): number[] => {
  const originXYZ = xyz.map((val, i) => val * RGB2XYZ_COEFF_ROW_SUM[i]);
  const scalingCoeff = RGB_MAXES / XYZ_MAXES;
  return XYZ2RGB_COEFF.map((row) => {
    return clip(dot(row, originXYZ) * scalingCoeff, 0, RGB_MAXES);
  });
};

/**
 * Convert CIE LAB to RGB.
 * @param lab CIE LAB color array.
 * @return RGB color array.
 */
const lab2rgb = (lab: number[]): number[] => {
  return xyz2rgb(lab2xyz(lab));
};

/**
 * Convert Hex color to RGB color.
 * @param hex Hex color string.
 * @return rgb
 */
export const hex2rgb = (hex: string): number[] => {
  hex = hex.replace(/[^0-9A-F]/ig, '');
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }
  const num = parseInt(hex, 16);
  return [num >> 16, (num >> 8) & 255, num & 255];
};

// Validator
/**
 * Verify the string whether is a (3 channel, no alpha channel) Hex color.
 * @param str String that need to be verified.
 * @return Validity of string.
 */
export const isValidHex = (str: string): boolean => {
  if (typeof str !== 'string') return false;
  if (str.startsWith('#')) str = str.slice(1);
  if (![3, 6].includes(str.length)) return false;
  const nonHex = str.match(/[^0-9A-F]/i);
  if (nonHex !== null) return false;
  return true;
};

/**
 * Returns informations about color space which will be display under hex code
 * and be used in edit mode.
 * @param space Color space.
 * @return ColorSpaceInfo
 */
export const getSpaceInfos = (space: ColorSpacesType): ColorSpaceInfos => {
  switch (space) {
    case 'hsl':
      return {
        labels: ['Hue', 'Saturation', 'Luminance'],
        range: [...HSL_MAXES],
      };
    case 'hsb': // hsb = hsv
      return {
        labels: ['Hue', 'Saturation', 'Brightness'],
        range: [...HSB_MAXES],
      };
    case 'cmy':
      return {
        labels: ['Cyan', 'Magenta', 'Yellow'],
        range: [CMY_MAXES, CMY_MAXES, CMY_MAXES],
      };
    case 'cmyk':
      return {
        labels: ['Cyan', 'Magenta', 'Yellow', 'Black'],
        range: [CMYK_MAXES, CMYK_MAXES, CMYK_MAXES, CMYK_MAXES],
      };
    case 'xyz':
      return {
        labels: ['X', 'Y', 'Z'],
        range: [XYZ_MAXES, XYZ_MAXES, XYZ_MAXES],
      };
    case 'lab':
      return {
        labels: ['L', 'a', 'b'],
        range: JSON.parse(JSON.stringify(LAB_MAXES)),
      };
    default: // "rgb" and "name"
      return {
        labels: ['Red', 'Green', 'Blue'],
        range: [RGB_MAXES, RGB_MAXES, RGB_MAXES],
      };
  }
};
export const getSpaceTrans = (space: ColorSpacesType): ColorSpaceTrans => {
  switch (space) {
    case 'hsl':
      return {
        converter: rgb2hsl,
        inverter: hsl2rgb,
      };
    case 'hsb': // hsb = hsv
      return {
        converter: rgb2hsb,
        inverter: hsb2rgb,
      };
    case 'cmy':
      return {
        converter: rgb2cmy,
        inverter: cmy2rgb,
      };
    case 'cmyk':
      return {
        converter: rgb2cmyk,
        inverter: cmyk2rgb,
      };
    case 'xyz':
      return {
        converter: rgb2xyz,
        inverter: xyz2rgb,
      };
    case 'lab':
      return {
        converter: rgb2lab,
        inverter: lab2rgb,
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
 * @return [R, G, B]
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
  const { inverter } = getSpaceTrans(space);
  const { range: maxes } = getSpaceInfos(space);
  const gradLength = Math.ceil(
    (
      typeof maxes[axis] === 'number' ?
        maxes[axis] :
        maxes[axis][1] - maxes[axis][0]
    ) / 8
  );
  const grads: string[] = [];
  const arr = [...colors];
  for (let j = 0; j < gradLength; j++) {
    arr.splice(axis, 1, j * 8);
    grads.push(`${rgb2hex(inverter(arr))} ${toPercent(j/gradLength)}%`);
  }
  return `linear-gradient(90deg, ${grads.join(', ')})`;
};


// Adjusts contrast.
/**
 * Scale ths values of RGB.
 * @param rgbs RGB arrays.
 * @param c Scaling coefficient.
 * @return `rgb` after scaling.
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
 * @param rgb RGB array(s).
 * @param gamma Gamma coefficient.
 * @return `rgb` after correction. The type is the
 * same as `rgb`.
 */
export const gammaCorrection = (
    rgb: number[] | number[][], gamma: number,
): typeof rgb => {
  if (typeof rgb[0] === 'number') {
    const normalizeCoeff = RGB_MAXES ** (1 - gamma);
    return (rgb as number[]).map((val) => normalizeCoeff * (val ** gamma));
  } else {
    return (rgb as number[][]).map(
        (arr) => gammaCorrection(arr, gamma) as number[],
    );
  }
};
