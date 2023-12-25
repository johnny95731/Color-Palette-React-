import {createSlice} from "@reduxjs/toolkit";
// Utils
import {randRgbGen, rgb2gray, rgb2hex} from "../../common/utils/converter.ts";
import {shuffle, inversion, meanMixing} from "../../common/utils/helpers.ts";
// Types
import {cardStateType, sortType, sortActionType} from "../types/cardType.ts";


/**
 * Create a new state object.
 * @return {cardStateType} State object.
 */
const newCardState = (): cardStateType => {
  const rgb = randRgbGen();
  return {
    rgb,
    hex: rgb2hex(rgb),
    isLock: false,
  };
};

const INIT_NUM_OF_CARDS = 5;
const initialState: {
  /**
   * Total number of cards.
   */
  numOfCards: number;
  cards: cardStateType[];
  /**
   * The order of cards.
   */
  sortBy: sortType;
} = {
  numOfCards: INIT_NUM_OF_CARDS,
  cards: Array.from({length: INIT_NUM_OF_CARDS}, () => newCardState()),
  sortBy: "random",
};

const cardSlice = createSlice({
  name: "card",
  initialState,
  reducers: {
    addCard: (state, action: {
      payload: {
        idx: number;
        mixingMode: string;
      };
      type: string;
    }) => {
      if (state.numOfCards == 8) return state; // Maximum
      const {idx, mixingMode} = action.payload;
      const cards = state.cards;
      const cardState = newCardState();
      if (mixingMode === "mean") { // RGB Mean
        // Color of cards at left side and at right side, respectively.
        // (before insert new card)
        let leftColor = cards[idx - 1]?.rgb;
        let rightColor = cards[idx]?.rgb;
        if (idx === 0) {
          // Add to the first. Default to be the mean of first card and black.
          leftColor = [0, 0, 0];
        } else if (idx === state.numOfCards) {
          // Add to the last. Default to be the mean of last card and white.
          rightColor = [255, 255, 255];
        }
        const newColor = meanMixing(leftColor, rightColor);
        cardState.rgb = newColor;
      }
      cardState.hex = rgb2hex(cardState.rgb);
      state.cards.splice(idx, 0, cardState);
      state.numOfCards = state.numOfCards + 1;
      return state;
    },
    delCard: (state, action: {
      payload: {idx: number;};
      type: string;
    }) => {
      const [...cards] = state.cards;
      cards.splice(action.payload.idx, 1);
      state.cards = cards;
      state.numOfCards = state.numOfCards - 1;
      return state;
    },
    lockCard: (state, action: {
      payload: {idx: number;};
      type: string;
    }) => {
      const {idx} = action.payload;
      state.cards[idx].isLock = !state.cards[idx].isLock;
    },
    moveCard: (state, action: {
      payload: {init: number; final: number};
      type: string;
    }) => {
      const {init, final} = action.payload;
      [state.cards[init], state.cards[final]] = [
        state.cards[final], state.cards[init],
      ];
    },
    refreshCard: (state, action: {
      payload: {idx: number;};
      type: string;
    }) => {
      const {idx} = action.payload;
      if (idx >= 0) {
        if (state.cards[idx].isLock) return state;
        state.cards[idx] = newCardState();
      } else if (idx === -1) {
        for (let i = 0; i < state.numOfCards; i++) {
          if (state.cards[i].isLock) continue;
          state.cards[i] = newCardState();
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
      payload: {sortBy: sortActionType};
      type: string;
    }) => {
      const {sortBy} = action.payload;
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
  },
});

export const {
  addCard, delCard, lockCard, moveCard, refreshCard, editCard, sortCards,
} = cardSlice.actions;
export default cardSlice.reducer;
