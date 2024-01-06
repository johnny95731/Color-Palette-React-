/**
 * The modulo function. Equivalent to
 *   `let a = n % m;
 *   if (a < 0) a += m;`
 * @param {Number} n Dividend.
 * @param {Number} m Divisor.
 * @return {Number} Signed remainder.
 */
export const mod = (n: number, m: number): number => {
  return ((n % m) + m) % m;
};

// Sorting
/**
 * Shuffle an array by Fisher-Yates shuffle. The process will change the input
 * array.
 * @template T
 * @param {Array<T>} arr The array be shuffled.
 */
export const shuffle = <T>(arr: Array<T>): void => {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
};

/**
 * Invert the order of an array. The process will change the input
 * array.
 * @template T
 * @param {Array<T>} arr The array be inverted.
 */
export const inversion = <T>(arr: Array<T>): void => {
  const lastIdx = arr.length - 1;
  for (let i = 0; i < arr.length / 2; i++) {
    [arr[i], arr[lastIdx - i]] = [arr[lastIdx - i], arr[i]];
  }
};

// Blending
type blend = (c1: number[], c2: number[]) => number[];
/**
 * Blending two colors by evaluate their average.
 * @param color1 Numeric of a color.
 * @param color2 Numeric of a color.
 * @returns The mean value of color1 and color2.
 */
export const meanBlend: blend = (color1, color2) => {
  const newColor = new Array(color1.length);
  for (let i = 0; i < color1.length; i++) {
    newColor[i] = 0.5 * (color1[i] + color2[i]);
  }
  return newColor;
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
  console.log(newColor);
  return newColor;
};

/**
 * Blending two colors by evaluate their root mean square.
 * @param color1 Numeric of a color.
 * @param color2 Numeric of a color.
 * @returns The mean value of color1 and color2.
 */
export const rmsBlend: blend = (color1, color2) => {
  const newColor = new Array(color1.length);
  for (let i = 0; i < color1.length; i++) {
    newColor[i] = Math.sqrt(0.5 * (color1[i]**2 + color2[i]**2));
  }
  return newColor;
};

// /**
//  * Blending two colors by evaluate their Logarithmic mean.
//  * @param {number[]} color1 Numeric of a color.
//  * @param {number[]} color2 Numeric of a color.
//  * @returns {number[]} The mean value of color1 and color2.
//  */
// export const logBlend = (color1: number[], color2: number[]): number[] => {
//   const newColor = [];
//   for (let i = 0; i < 3; i++) {
//     if (!color1[i] || !color2[i]) newColor.push(0);
//     else if (color1[i] === color2[i]) newColor.push(color1[i]);
//     else {
//       newColor.push(
//           (color1[i] - color2[i]) / Math.log(color1[i] / color2[i]),
//       );
//     }
//   }
//   return newColor;
// };


// Events
/**
 * Remove non-hex text and add "#" to first word.
 * @param e Triggered mouse event.
 */
export const hexTextEdited = (
    e: React.ChangeEvent<HTMLInputElement>,
): void => {
  const textInput = e.currentTarget;
  let text = (textInput.value).toUpperCase();
  text = text.replace(/[^A-F0-9]/g, "");
  textInput.value = `#${text}`;
};
/**
 * Copy Hex text to clipboard (excludes "#").
 * @param e Triggered mouse event.
 */
export const copyHex = (
    e: React.MouseEvent<HTMLDivElement | HTMLSpanElement>,
): void => {
  const target = e.currentTarget;
  if (!target) return;
  const text = target.innerText;
  const brIdx = text.indexOf("\n"); // index of break.
  const start = text.startsWith("#") ? 1 : 0;
  let hex: string;
  if (brIdx > -1) {
    hex = text.slice(start, brIdx);
  } else {
    hex = text.slice(start);
  }
  try {
    navigator.clipboard.writeText(hex);
  } catch (e) {
    console.log(e);
  }
};
