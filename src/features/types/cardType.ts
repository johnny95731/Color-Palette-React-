import {randRgbGen, rgb2hex} from "../../common/utils/converter.ts";

export type SortingType = "gray" | "random";
export type SortActionType = "gray" | "inversion" | "random";

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
   * The card is lock (can't refresh the card).
   */
  isLock: boolean;
  /**
   * The card is in editing mode.
   */
  isEditing: boolean;
};

/**
 * Create a new state object.
 * @param {number} order The order of this card in a group.
 * @return {cardStateType} State object.
 */
export const newCardState = (): cardStateType => {
  const rgb = randRgbGen();
  return {
    rgb,
    hex: rgb2hex(rgb),
    isLock: false,
    isEditing: false,
  };
};
