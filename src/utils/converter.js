
// From RGB.
/**
 * Convert RGB to Hex.
 * @param {Array} rgb RGB color array.
 * @return {Array} Hex color.
 */
export const rgb2hex = (rgb) => {
  return rgb.reduce(
      (cummul, val) => {
        // Convert int to hex.
        if (typeof val === "number") {
          val = val.toString(16).toUpperCase();
        } else {
          val = Number(val).toString(16).toUpperCase();
        }
        if (val.length === 1) {
          return cummul + "0" + val;
        } else {
          return cummul += val;
        }
      }, "#",
  );
};
/**
 * Conver hex to luminance (L channel of HSL).
 * @param {Array} rgb RGB color array.
 * @return {Number} Luminance (L channel of HSL).
 */
export const hex2lum = (rgb) => {
  return Math.round((Math.max(...rgb) + Math.min(...rgb)) / 2);
};

/**
 * Conver hex to value (V channel of HSV).
 * @param {Array} rgb RGB color array.
 * @return {Number} value
 */
export const rgb2val = (rgb) => {
  return Math.max(...rgb);
};

/**
 * Conver hex to black (k of cmyk).
 * @param {Array} rgb RGB color array.
 * @return {Number} black
 */
export const rgb2k = (rgb) => {
  return Math.min(...rgb);
};

const RGB_2_GRAY_COEFF = [0.299, 0.587, 0.114];
/**
 * Conver hex to grayscale.
 * @param {Array} rgb RGB color array.
 * @return {Number} grayscale
 */
export const rgb2gray = (rgb) => {
  return rgb.reduce((cummul, val, i) => cummul += val * RGB_2_GRAY_COEFF[i], 0);
};

/**
 * Calculate hue (H channel of HSL/HSV) from rgb.
 * @param {Array} rgb RGB color array.
 * @return {Array} [hue, min(r,g,b), max(r,g,b)].
 */
const rgb2hue = (rgb) => {
  const [r, g, b] = rgb;
  let h;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max === min) {
    return [0, 0, r];
  } else if (max === r) {
    if (g >= b) h = (g-b) / (max-min) * 60;
    else if (b > g) h = (g-b) / (max-min) * 60 + 360;
  } else if (max === g) {
    h = (b-r) / (max-min) * 60 + 120;
  } else {
    h = (r-g) / (max-min) * 60 + 240;
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
  const s = max === 0 ? 0 : (1 - (min/max)) * 255;
  const v = max;
  return [h, s, v].map((val)=> Math.round(val));
};

/**
 * Convert RGB to HSL.
 * @param {Array} rgb RGB color array.
 * @return {Array} [hue, sat, lum]
 */
export const rgb2hsl = (rgb) => {
  const [h, min, max] = rgb2hue(rgb);
  const l = (max+min) / 2;
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
  if ( hex.length === 3 ) { // eg, #e52 === #ee5522
    return hex.split("").map((str, i) => parseInt(str+str, 16));
  } else if ( hex.length === 6 ) {
    return Array.from(
        {length: 3},
        (_, i) => parseInt(hex.slice(2*i, 2*i+2), 16),
    );
  }
  return null;
};


// Generators
/**
 * Generate an RGB color.
 * @return {Array} [R, G, B]
 */
export const randRgbGen = () => {
  return Array.from({length: 3}, () => {
    return Math.floor(Math.random()*256);
  });
};


// Hex.
/**
 * Verify the string whether is a hex color.
 * @param {String} hex Hex color string.
 * @return {Boolean} Validity of string.
 */
export const isValidHex = (hex) => {
  if (typeof hex !== "string") return false;
  let str = String(hex);
  if (str.startsWith("#")) str = str.slice(1);
  else return false;
  str = str.replace(/[^a-f0-9]+$/ig, "");
  console.log(hex, str, (str.length !== 3), str.length !== 6);
  if ((str.length !== 3) && (str.length !== 6)) return false;
  return true;
};
