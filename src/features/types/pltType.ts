import {
  SORTING_ACTIONS, COLOR_SPACES, BLEND_MODES,
} from "@/common/utils/constants";


/**
 * The current order of cards.
 */
export type OrderStateType = "gray" | "random";
export type SortActionType = typeof SORTING_ACTIONS[number];
/**
 * Support color spaces.
 */
export type ColorSpacesType = typeof COLOR_SPACES[number];
/**
 * Support blend modes.
 */
export type BlendingType = typeof BLEND_MODES[number];

export type CardType = {
  /**
   * RGB sapce value in hex code.
   */
  hex: string;
  /**
   * Color array in specific color space.
   */
  color: number[];
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
