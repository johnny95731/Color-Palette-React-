import {createSlice} from "@reduxjs/toolkit";
// Utils
import {rgb2gray, rgb2hex} from "../../common/utils/colors.ts";
import {shuffle, inversion} from "../../common/utils/helpers.ts";
import {blendBy} from "../../common/utils/blend.ts";
// Types
import {
  newCard, cardType, orderStateType, SortActionType,
} from "../types/cardType.ts";
import {ColorSpacesType, BlendingType} from "../types/optionsType.ts";


const INIT_NUM_OF_CARDS = 5;
const initialState: {
  /**
   * Total number of cards.
   */
  numOfCards: number;
  cards: cardType[];
  /**
   * The order of cards.
   */
  sortBy: orderStateType;
  /**
   * The cards is reordering. `true` if and only if cursor dragging a card.
   */
  isReordering: boolean;
} = {
  numOfCards: INIT_NUM_OF_CARDS,
  cards: Array.from({length: INIT_NUM_OF_CARDS}, () => newCard()),
  sortBy: "random",
  isReordering: false,
};

const cardSlice = createSlice({
  name: "card",
  initialState,
  reducers: {
    addCard: (state, action: {
      payload: {
        idx: number;
        blendMode: BlendingType;
        editingMode: ColorSpacesType;
      };
      type: string;
    }) => {
      if (state.numOfCards == 8) return state; // Maximum
      const {idx, blendMode, editingMode} = action.payload;
      const cards = state.cards;
      const cardState = newCard();
      if (blendMode !== "random") { // RGB Mean
        // Pick cards.
        let leftColor = cards[idx - 1]?.rgb;
        let rightColor = cards[idx]?.rgb;
        // -Add to the first. Blending the first card and black.
        if (!leftColor) leftColor = [0, 0, 0];
        // -Add to the last. Blending the last card and white.
        if (!rightColor) rightColor = [255, 255, 255];
        // Blend
        cardState.rgb = blendBy[blendMode](leftColor, rightColor, editingMode);
      }
      cardState.hex = rgb2hex(cardState.rgb);
      state.cards.splice(idx, 0, cardState);
      state.numOfCards = state.numOfCards + 1;
      return state;
    },
    delCard: (state, action: {
      payload: number;
      type: string;
    }) => {
      const idx = action.payload;
      const [...cards] = state.cards;
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
        state.cards[idx] = newCard();
      } else if (idx === -1) {
        for (let i = 0; i < state.numOfCards; i++) {
          if (state.cards[i].isLock) continue;
          state.cards[i] = newCard();
        }
      }
      state.sortBy = "random";
    },
    editCard: (state, action: {
      payload: {idx: number; color: Array<number>;};
      type: string;
    }) => {
      const {idx, color} = action.payload;
      state.cards[idx].rgb = color;
      state.cards[idx].hex = rgb2hex(color);
      state.sortBy = "random";
    },
    sortCards: (state, action: {
      payload: SortActionType;
      type: string;
    }) => {
      const sortBy = action.payload;
      switch (sortBy) {
        case "gray":
          if (state.sortBy === "gray") {
            inversion(state.cards);
            break;
          }
          state.cards.sort((a, b) => rgb2gray(a.rgb) - rgb2gray(b.rgb));
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
    setIsReordering: (state, action: {
      payload: boolean;
      type: string;
    }) => {
      const newVal = action.payload;
      state.isReordering = newVal;
    },
  },
});

export const {
  addCard, delCard, refreshCard, editCard, sortCards, setIsLock, setIsEditing,
  moveCard, setIsReordering,
} = cardSlice.actions;
export default cardSlice.reducer;
