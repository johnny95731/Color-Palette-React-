
export type sortType = "gray" | "random";
export type sortActionType = "gray" | "inversion" | "random";

export type cardStateType = {
  /**
   * RGB sapce value, [red, green, blue].
   */
  rgb: number[];
  /**
   * RGB sapce value in hex code.
   */
  hex: string;
  /**
   * The color is lock or not.
   */
  isLock: boolean;
};
