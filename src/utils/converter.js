/**
 * The modulo function. Equivalent to
 *   `let a = n % m;
 *   if (a < 0) a += m;`
 * @param {Number} n Dividend.
 * @param {Number} m Divisor.
 * @return {Number} Signed remainder.
 */
export const mod = (n, m) => {
  return ((n % m) + m) % m;
};

// From RGB.
/**
 * Convert RGB to Hex.
 * @param {Array} rgb RGB color array.
 * @return {String} Hex color.
 */
export const rgb2hex = (rgb) => {
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
/**
 * Conver RGB to luminance (L channel of HSL).
 * @param {Array} rgb RGB color array.
 * @return {Number} Luminance (L channel of HSL).
 */
// export const rgb2lum = (rgb) => {
//   return Math.round((Math.max(...rgb) + Math.min(...rgb)) / 2);
// };

/**
 * Conver RGB to value (V channel of HSV).
 * @param {Array} rgb RGB color array.
 * @return {Number} value
 */
// export const rgb2val = (rgb) => {
//   return Math.max(...rgb);
// };

/**
 * Conver Hex to black (k of cmyk).
 * @param {Array} rgb RGB color array.
 * @return {Number} black
 */
// export const rgb2k = (rgb) => {
//   return Math.min(...rgb);
// };

const RGB_2_GRAY_COEFF = [0.299, 0.587, 0.114];
/**
 * Conver Hex to grayscale.
 * @param {Array} rgb Array of RGB color.
 * @return {Number} grayscale
 */
export const rgb2gray = (rgb) => {
  return rgb.reduce((cummul, val, i) => cummul += val * RGB_2_GRAY_COEFF[i], 0);
};

/**
 * Calculate hue (H channel of HSL/HSV) from rgb. Also, returns minimum and
 * maximum of rgb.
 * @param {Array} rgb RGB array.
 * @return {Array} [hue, min(r,g,b), max(r,g,b)].
 */
const rgb2hue = (rgb) => {
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
 * @return {Array} [hue, sat, val].
 */
export const rgb2hsv = (rgb) => {
  const [h, min, max] = rgb2hue(rgb);
  const s = max ? ((max - min) / max) * 255 : 0;
  return [h, s, max].map((val)=> Math.round(val));
};

/**
 * Convert RGB to HSL.
 * @param {Array} rgb RGB color array.
 * @return {Array} [hue, sat, lum]
 */
export const rgb2hsl = (rgb) => {
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
  return [h, s, l].map((val)=> Math.round(val));
};

/**
 * Convert RGB to CMY.
 * @param {Array} rgb RGB color array.
 * @return  {Array} cmy CMY color array.
 */
export const rgb2cmy = (rgb) => {
  return rgb.map((val) => 255 - val);
};


// To RGB.
/**
 * Convert HSV to RGB.
 * @param  {Array} hsv HSV color array.
 * @return {Array} RGB color array.
 */
export const hsv2rgb = (hsv) => {
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
  let rgbPrime;
  if (hsv[0] < 60) rgbPrime = [C, X, 0];
  else if (hsv[0] < 120) rgbPrime = [X, C, 0];
  else if (hsv[0] < 180) rgbPrime = [0, C, X];
  else if (hsv[0] < 240) rgbPrime = [0, X, C];
  else if (hsv[0] < 300) rgbPrime = [X, 0, C];
  else if (hsv[0] < 360) rgbPrime = [C, 0, X];
  return rgbPrime.map((val) => Math.round(255 * (val+m)));
};

/**
 * Convert HSL to RGB.
 * @param  {Array} hsl HSL array.
 * @return {Array} RGB color array.
 */
export const hsl2rgb = (hsl) => {
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
  return rgbPrime.map((val) => Math.round(255 * (val+m)));
};

/**
 * Convert CMY to RGB.
 * @param  {Array} cmy CMY color array.
 * @return {Array} RGB color array.
 */
export const cmy2rgb = (cmy) => {
  return rgb2cmy(cmy);
};

/**
 * Convert Hex color to RGB color.
 * @param {String} hex Hex color string.
 * @return {Array} rgb
 */
export const hex2rgb = (hex) => {
  if (hex.startsWith("#")) {
    hex = hex.slice(1);
  }
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
 * @return {Array} [R, G, B]
 */
export const randRgbGen = () => {
  const rgb = new Array(3);
  for (let i = 0; i < 3; i ++) {
    rgb[i] = Math.floor(Math.random() * 256);
  }
  return rgb;
};
/**
 * Generate a Hex color.
 * @return {Array} [R, G, B]
 */
export const randHexGen = () => {
  let hex6 = "#";
  for (let i = 0; i < 6; i ++) {
    hex6 += Math.floor(Math.random() * 16).toString(16);
  }
  return hex6.toUpperCase();
};


// Validator
/**
 * Verify the string whether is a Hex color.
 * @param {String} hex Hex color string.
 * @return {Boolean} Validity of string.
 */
export const isValidHex = (hex) => {
  if (typeof hex !== "string") return false;
  let str = String(hex);
  if (str.startsWith("#")) str = str.slice(1);
  else return false;
  const nonHex = str.match(/[^0-9A-F]/i);
  // str = str.replace(/[^0-9A-F]+$/ig, "");
  if ((nonHex !== null) || (![3, 6].includes(str.length))) return false;
  return true;
};
