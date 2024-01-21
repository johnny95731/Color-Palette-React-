import {SORTING_ACTIONS} from "@/common/utils/constants";

/**
 * The current order of cards.
 */
export type orderStateType = "gray" | "random";
export type SortActionType = typeof SORTING_ACTIONS[number];

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
