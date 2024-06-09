/**
 * font-weight that be used in selected option.
 */
export const CURRENT_OPTION_WEIGHT: React.CSSProperties = {
  fontWeight: 700,
};

// Palette consts.
/**
 * Support color spaces.
 */
export const COLOR_SPACES = [
  'rgb', 'name', 'hsl', 'hsb', 'cmy', 'cmyk', 'xyz', 'lab',
] as const;

/**
 * Support blend modes.
 */
export const BLEND_MODES = [
  'mean', 'brighter', 'deeper', 'soft light', 'random',
] as const;

/**
 * Actions for sorting palette colors.
 */
export const SORTING_ACTIONS = ['gray', 'random', 'inversion'] as const;

/**
 * Methods of adjusting contrast.
 */
export const CONTRAST_METHODS = [
  'multiplication', 'gamma',
] as const;

export const MULTIPLICATION_MAX = 10;
export const GAMMA_MAX = 3;

// Maximums of each color space.
// export const MAXES = {
//   rgb: 255,
//   hsl: [359, 100, 100],
//   hsb: [359, 100, 100],
//   cmy: 100,
//   cmyk: 100,
//   xyz: 100,
//   lab: [100, [-125, 125], [-125, 125]]
// } as const;
export const RGB_MAXES = 255;
export const HSL_MAXES = [359, 100, 100] as const;
export const HSB_MAXES = [359, 100, 100] as const;
export const CMY_MAXES = 100;
export const CMYK_MAXES = 100;
export const XYZ_MAXES = 100;
export const LAB_MAXES = [100, [-125, 125], [-125, 125]] as const;

/**
 * Initial number of color in palette.
 */
export const INIT_NUM_OF_CARDS = 5;
export const MAX_NUM_OF_CARDS = 8;
export const MIN_NUM_OF_CARDS = 2;
/**
 * Initial color space in palette.
 */
export const INIT_COLOR_SPACE = 'name';


// Settings consts.
export const BORDER_MAX_WIDTH = 15 as const;
export const BORDER_COLOR = ['white', 'gray', 'black'] as const;

/**
 * Maximum transition time of card pos.
 */
export const TRANSITION_MAX_POS = 1000;
/**
 * Maximum transition time of card color.
 */
export const TRANSITION_MAX_COLOR = 3000;
