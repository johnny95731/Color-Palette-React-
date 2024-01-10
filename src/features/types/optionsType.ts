export const ColorSpacesList = ["rgb", "hsl", "hsb", "cmyk"] as const;
export type ColorSpacesType = typeof ColorSpacesList[number];

export const BlendModeList = [
  "mean", "brighter", "deeper", "soft light", "random",
] as const;
export type BlendingType = typeof BlendModeList[number];

/**
 * Maximums of each color space. The range of color space is
 * [0, resolution].
 */
export const spaceMaxes = {
  "rgb": 255,
  "hsl": [359, 255, 255],
  "hsb": [359, 255, 255],
  "cmyk": 100,
} as const;
