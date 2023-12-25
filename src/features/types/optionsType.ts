
export const ColorSpacesList = ["rgb", "hsl", "hsb", "cmy"] as const;
export type ColorSpacesType = typeof ColorSpacesList[number];

export const MixingModeList = ["mean", "random"] as const;
export type MixingModeType = typeof MixingModeList[number];
