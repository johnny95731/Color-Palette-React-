export const ColorSpacesList = ["rgb", "hsl", "hsb", "cmy"] as const;
export type ColorSpacesType = typeof ColorSpacesList[number];

export const BlendModeList = [
  "mean", "brighter", "soft light", "random",
] as const;
export type BlendingType = typeof BlendModeList[number];

/**
 * Resolutions of each color space. The range of color space is
 * [0, resolution - 1].
 */
export const spaceResolutions = {
  "rgb": [256, 256, 256],
  "hsl": [360, 256, 256],
  "hsb": [360, 256, 256],
  "cmy": [256, 256, 256],
} as const;

/**
 * Get maximums from resolutions.
 * @param {number[]} arr Resolutions;
 * @returns {number[]} Maximums
 */
export const getMaxesFromRes = (arr: readonly number[]): number[] => {
  const output = new Array(arr.length);
  for (let i = 0; i < arr.length; i++) {
    output[i] = arr[i] - 1;
  }
  return output;
};
