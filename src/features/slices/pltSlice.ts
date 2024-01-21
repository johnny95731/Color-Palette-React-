import {createSlice} from "@reduxjs/toolkit";
// Utils
import {
  hex2rgb, randRgbGen, rgb2gray, rgb2hex, getSpaceInfos,
} from "@/common/utils/colors";
import {shuffle, inversion} from "@/common/utils/helpers";
import {blenders} from "@/common/utils/blend";
import {INIT_NUM_OF_CARDS} from "@/common/utils/constants";
// Types
import type {
  CardType, OrderStateType, SortActionType, ColorSpacesType, BlendingType,
} from "types/pltType";

/**
 * Create a new state object.
 * @return {CardType} State object.
 */
export const newCard = (
    colorSpace: ColorSpacesType, color?: number[],
): CardType => {
  const infos = getSpaceInfos(colorSpace);
  if (!color) {
    const rgb = randRgbGen();
    return {
      hex: rgb2hex(rgb),
      color: infos.converter(rgb),
      isLock: false,
      isFav: false,
      isEditing: false,
    };
  } else {
    const rgb = infos.inverter(color);
    return {
      hex: rgb2hex(rgb),
      color,
      isLock: false,
      isFav: false,
      isEditing: false,
    };
  }
};
const initialState: {
  /**
   * Total number of cards.
   */
  numOfCards: number;
  cards: CardType[];
  /**
   * The order of cards.
   */
  sortBy: OrderStateType;
  /**
   * The cards is reordering. `true` if and only if cursor dragging a card.
   */
  isReordering: boolean;
  /**
   * How to evaluate a new color when insert a new card.
   */
  blendMode: BlendingType,
  /**
   * Color space which will be display under hex code and be used in edit mode.
   */
  colorSpace: ColorSpacesType,
} = {
  numOfCards: INIT_NUM_OF_CARDS,
  cards: Array.from({length: INIT_NUM_OF_CARDS}, () => newCard("rgb")),
  sortBy: "random",
  isReordering: false,
  blendMode: "mean",
  colorSpace: "rgb",
};

const cardSlice = createSlice({
  name: "plt",
  initialState,
  reducers: {
    // Card actions
    addCard: (state, action: {
      payload: number;
      type: string;
    }) => {
      if (state.numOfCards == 8) return state;
      const idx = action.payload;
      const cards = state.cards;
      const cardState = newCard(state.colorSpace);
      if (state.blendMode !== "random") { // RGB Mean
        const {converter, inverter} = getSpaceInfos(state.colorSpace);
        // Pick cards.
        let leftRgbColor;
        let rightRgbColor;
        // -Add to the first. Blending the first card and black.
        if (!idx) leftRgbColor = [0, 0, 0];
        else leftRgbColor = inverter(cards[idx - 1].color);
        // -Add to the last. Blending the last card and white.
        if (idx === state.numOfCards) rightRgbColor = [255, 255, 255];
        else rightRgbColor = inverter(cards[idx].color);
        // Blend
        const rgb = blenders[state.blendMode](
            leftRgbColor, rightRgbColor, state.colorSpace,
        );
        cardState.color = converter(rgb);
        cardState.hex = rgb2hex(rgb);
      }
      state.cards.splice(idx, 0, cardState);
      state.numOfCards = state.numOfCards + 1;
      return state;
    },
    delCard: (state, action: {
      payload: number;
      type: string;
    }) => {
      if (state.numOfCards === 2) return state;
      const idx = action.payload;
      const cards = state.cards;
      cards.splice(idx, 1);
      state.cards = cards;
      state.numOfCards = state.numOfCards - 1;
      return state;
    },
    refreshCard: (state, action: {
      payload: number;
      type: string;
    }) => {
      const idx = action.payload;
      if (idx >= 0) {
        if (state.cards[idx].isLock) return state;
        state.cards[idx] = newCard(state.colorSpace);
      } else if (idx === -1) {
        for (let i = 0; i < state.numOfCards; i++) {
          if (state.cards[i].isLock) continue;
          state.cards[i] = newCard(state.colorSpace);
        }
      }
      state.sortBy = "random";
    },
    editCard: (state, action: {
      payload: {
        idx: number;
        color: number[];
      };
      type: string;
    }) => {
      const {idx, color} = action.payload;
      const {inverter} = getSpaceInfos(state.colorSpace);
      state.cards[idx].color = color;
      state.cards[idx].hex = rgb2hex(inverter(color));
      state.sortBy = "random";
    },
    sortCards: (state, action: {
      payload: SortActionType;
      type: string;
    }) => {
      const sortBy = action.payload;
      const {inverter} = getSpaceInfos(state.colorSpace);
      switch (sortBy) {
        case "gray":
          if (state.sortBy === "gray") {
            inversion(state.cards);
            break;
          }
          state.cards.sort((a, b) => {
            return rgb2gray(inverter(a.color)) - rgb2gray(inverter(b.color));
          });
          state.sortBy = "gray";
          break;
        case "inversion":
          /**
           * Inversion will not change sortBy. For example, if cards are sorted
           * by gray (brightness), inversion just change most lightest card on
           * left side or on right side.
           */
          inversion(state.cards);
          break;
        case "random":
          shuffle(state.cards);
          state.sortBy = "random";
      }
    },
    setIsLock: (state, action: {
      payload: number;
      type: string;
    }) => {
      const idx = action.payload;
      state.cards[idx].isLock = !state.cards[idx].isLock;
    },
    setIsEditing: (state, action: {
      payload: number;
      type: string;
    }) => {
      const idx = action.payload;
      state.cards[idx].isEditing = !state.cards[idx].isEditing;
    },
    moveCard: (state, action: {
      payload: {init: number; final: number};
      type: string;
    }) => {
      const {init: init, final: final} = action.payload;
      const card = state.cards.splice(init, 1)[0];
      state.cards.splice(final, 0, card);
    },
    // Plt state
    setIsReordering: (state, action: {
      payload: boolean;
      type: string;
    }) => {
      const newVal = action.payload;
      state.isReordering = newVal;
    },
    setPlt: (state, action: {
      payload: string[];
      type: string;
    }) => {
      const plt = action.payload;
      state.cards = plt.map((hex) => newCard(
          state.colorSpace, hex2rgb(hex) as number[],
      ));
      state.numOfCards = plt.length;
      state.sortBy = "random";
      return state;
    },
    setColorSpace: (state, action: {
      payload: ColorSpacesType;
      type: string;
    }) => {
      const {inverter} = getSpaceInfos(state.colorSpace); // Convert to RGB.
      // Convert to new space.
      const {converter} = getSpaceInfos(action.payload);
      state.colorSpace = action.payload;
      for (let i = 0; i < state.numOfCards; i++) {
        const rgb = inverter(state.cards[i].color);
        state.cards[i].color = converter(rgb);
      }
    },
    setBlendMode: (state, action: {
      payload: BlendingType;
      type: string;
    }) => {
      state.blendMode = action.payload;
    },
  },
});

export const {
  addCard, delCard, refreshCard, editCard, sortCards, setIsLock, setIsEditing,
  moveCard, setIsReordering, setPlt, setColorSpace, setBlendMode,
} = cardSlice.actions;
export default cardSlice.reducer;
