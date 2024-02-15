import NAMED_COLORS from "./named-color.json";

/**
 * The modulo function. Equivalent to
 *   `let a = n % m;
 *    if (a < 0) a += m;`
 * @param {Number} n Dividend.
 * @param {Number} m Divisor.
 * @return {Number} Signed remainder.
 */
export const mod = (n: number, m: number): number => {
  return ((n % m) + m) % m;
};

/**
 * Convert a number `val` to percentage form, that is, `val*100%`.
 * @param num A number.
 * @param digits Digit of output number.
 * @return Percentage number.
 */
export const round = (num: number, digits: number = 0): number => {
  return Math.round(10**(digits) * num) / 10**(digits);
};

/**
 * Convert a number `val` to percentage form, that is, `val*100%`.
 * @param num A number.
 * @param digits Digit of output number.
 * @return Percentage number.
 */
export const toPercent = (num: number, digits: number = 0): number => {
  return round(100 * num, digits);
};

/**
 * Clip the number in the range `[min, max]`.
 * @param num A number to clip.
 * @param min Minimum value.
 * @param max maximum value.
 * @returns Clipped number.
 */
export const clip = (num: number, min?: number, max?: number): number => {
  if (max !== undefined && num > max) return max;
  else if (min !== undefined && num < min) return min;
  else return num;
};

/**
 * Linear mapping a number from a range to another range.
 * @param val The value that be transform.
 * @param min Minimum of original range.
 * @param max Maximum of original range.
 * @param newMin Minimum of new range.
 * @param newMax Maximum of new range.
 */
export const rangeMapping = (
    val: number, min: number, max: number,
    newMin: number, newMax: number,
) => {
  const ratio = clip((val - min) / (max - min), 0, 1);
  return newMin + ratio * (newMax - newMin);
};

/**
 * Check whether two object has same keys.
 */
export const hasSameKeys = (obj1: object, obj2: object): boolean => {
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  const allKeys = new Set([...keys1, ...keys2]);
  if (!allKeys.size) return true;
  if (!(allKeys.size === keys1.length && allKeys.size === keys2.length)) {
    return false;
  }
  // Deep check
  for (const key of allKeys) {
    // @ts-expect-error Already deal `undefined` case.
    const item1 = typeof obj1[key] === "object" ? obj1[key] : {};
    // @ts-expect-error Already deal `undefined` case.
    const item2 = typeof obj2[key] === "object" ? obj2[key] : {};
    if (!hasSameKeys(item1, item2)) false;
  }
  return true;
};

/**
 * Evaluate length that are divided evenly by `num`.
 * @param num Total number.
 */
export const evalLength = (num: number): string => {
  return `${toPercent(1 / num, 2)}%`;
};

/**
 * Divide evenly by `num` and return the `idx`-th position.
 * @param num Total number.
 */
export const evalPosition = (idx: number, num: number): string => {
  return `${toPercent(idx / num, 2)}%`;
};

/**
 * Capitalize a text.
 */
export const capitalize = (text: string) => {
  const words = text.split(" ");
  words.forEach((str, i, arr) => {
    arr[i] = `${str[0].toUpperCase()}${str.slice(1)}`;
  });
  return words.join(" ");
};

/**
 * Get closet name of css named color. The distance is evaluate by L_1 norm.
 * @param rgb
 * @returns {keyof typeof NAMED_COLORS}
 */
export const getClosestName = (rgb: number[]) => {
  let name: string = "";
  let minDist = Infinity;
  let dist: number;
  for (const [key, vals] of Object.entries(NAMED_COLORS)) {
    dist = 0;
    for (let i = 0; i < 3; i++) {
      dist += Math.abs(rgb[i] - vals[i]);
    }
    if (dist < minDist) {
      name = key;
      minDist = dist;
    }
  }
  return name;
};

export const identity = <T>(x: T[]): T[] => Array.from(x);

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

// Averages
/**
 * Evaluate elementwise mean of two arrays.
 * @param arr1 Numeric of a color.
 * @param arr2 Numeric of a color.
 * @returns The mean value of color1 and color2.
 */
export const elementwiseMean = (arr1: number[], arr2: number[]): number[] => {
  const newColor = new Array(arr1.length);
  for (let i = 0; i < arr1.length; i++) {
    newColor[i] = 0.5 * (arr1[i] + arr2[i]);
  }
  return newColor;
};

// Events
export const preventDefault = (e: MouseEvent) => {
  e.preventDefault();
  return false;
};
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
  } catch (err) {
    console.error("copy hex:", err);
  }
};

export const showPopupMenu = (
    e: React.MouseEvent<HTMLElement> | React.FocusEvent<HTMLElement>,
) => {
  const target = e.currentTarget;
  const content = target.lastChild as HTMLElement;
  if ((e as React.FocusEvent).type === "blur") {
    content.style.maxHeight = "";
    return;
  }
  /**
   * For small size device, menu has 2 layers. The outer mune content contains
   * menu (inner menu) and non-menu (button). And both layers' menu connet to
   * this function. Click outer menu content has following 3 cases.
   * 1. Click non-menu: target === (outer menu). Trigger button event and close
   *    outer content.
   * In case 2 and 3, target === (inner menu).
   * 2. Click inner menu: content === (inner menu content). Hence, stop
   *    propagation to outer menu and open inner menu content.
   * 3. Click inner menu content: (!content.contains(e.target) === false).
   *    Hence, do propagation => close outer menu content.
   */
  if (!content.contains(e.target as Node)) {
    e.stopPropagation();
  }
  const height = content.style.maxHeight;
  if (height === "") {
    content.style.maxHeight = "100vh";
  } else {
    content.style.maxHeight = "";
    target.blur();
  }
};
