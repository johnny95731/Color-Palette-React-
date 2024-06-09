import {
  SORTING_ACTIONS, COLOR_SPACES, BLEND_MODES, CONTRAST_METHODS,
} from 'utils/constants';


/**
 * The current order of cards.
 */
export type OrderStateType = 'gray' | 'random';
export type SortActionType = typeof SORTING_ACTIONS[number];
/**
 * Support color spaces.
 */
export type ColorSpacesType = typeof COLOR_SPACES[number];
/**
 * Support blend modes.
 */
export type BlendingType = typeof BLEND_MODES[number];

/**
 * Support contrast adjusting methods.
 */
export type ContrastMethods = typeof CONTRAST_METHODS[number];

export type CardType = {
  /**
   * Order of card in palette.
   */
  order: number;
  /**
   * RGB hex code.
   */
  hex: string;
  /**
   * Color array in specific color space.
   */
  color: number[];
  /**
   * Stores hex before editing the palette.
   */
  originHex: string;
  /**
   * Stores color before editing the palette.
   */
  originColor: number[];
  /**
   * The card is lock (can't refresh the card).
   */
  isLock: boolean;
  /**
   * The card is in bookmarks.
   */
  isFav: boolean;
};
