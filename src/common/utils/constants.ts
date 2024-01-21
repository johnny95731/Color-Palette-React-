
/**
 * Support color spaces.
 */
export const COLOR_SPACES = [
  "rgb", "hsl", "hsb", "cmy", "cmyk", "name",
] as const;

/**
 * Support blend modes.
 */
export const BLEND_MODES = [
  "mean", "brighter", "deeper", "soft light", "random",
] as const;

/**
 * Actions for sorting palette colors.
 */
export const SORTING_ACTIONS = ["gray", "random", "inversion"] as const;

/**
 * Maximums of each color space.
 */
export const SPACE_MAXES = Object.freeze({
  "rgb": 255,
  "hsl": [359, 255, 255],
  "hsb": [359, 255, 255],
  "cmy": 100,
  "cmyk": 100,
  "name": 0,
});

/**
 * Initial number of color in palette.
 */
export const INIT_NUM_OF_CARDS = 5;
