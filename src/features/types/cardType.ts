import {randRgbGen, rgb2hex} from "../../common/utils/converter.ts";

/**
 * The current order of cards.
 */
export type orderStateType = "gray" | "random";

/**
 * Action argument.
 */
export const sortAction = ["gray", "random", "inversion"] as const;
export type SortActionType = typeof sortAction[number];

export type cardType = {
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
   * The card is in bookmarks.
   */
  isFav: boolean;
  /**
   * The card is in editing mode.
   */
  isEditing: boolean;
};

/**
 * Create a new state object.
 * @return {cardType} State object.
 */
export const newCard = (): cardType => {
  const rgb = randRgbGen();
  return {
    rgb,
    hex: rgb2hex(rgb),
    isLock: false,
    isFav: false,
    isEditing: false,
  };
};
