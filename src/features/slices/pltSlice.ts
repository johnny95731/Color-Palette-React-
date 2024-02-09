import {createSlice} from "@reduxjs/toolkit";
// Utils
import {
  hex2rgb, randRgbGen, rgb2gray, rgb2hex, gammaCorrection, getSpaceTrans,
  scaling,
} from "@/common/utils/colors";
import {shuffle} from "@/common/utils/helpers";
import {
  INIT_NUM_OF_CARDS, INIT_COLOR_SPACE, MAX_NUM_OF_CARDS,
} from "@/common/utils/constants";
// Types
import type {
  CardType, OrderStateType, SortActionType, ColorSpacesType, BlendingType,
} from "types/pltType";

/**
 * Create a new state object.
 * @return {CardType} State object.
 */
export const newCard = (
    order: number, colorSpace: ColorSpacesType, rgb?: number[],
): CardType => {
  const infos = getSpaceTrans(colorSpace);
  if (!rgb) rgb = randRgbGen();
  const color = infos.converter(rgb);
  const hex = rgb2hex(rgb);
  return {
    order,
    hex,
    color,
    originHex: hex,
    originColor: color,
    isLock: false,
    isFav: false,
    isEditing: false,
  };
};

type StateType = {
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
   * Cards is reordering. `true` if and only if dragging a card.
   */
  isReordering: boolean;
  /**
   * Edit the palette.
   */
  isEditingPlt: boolean;
  /**
   * How to evaluate a new color when insert a new card.
   */
  blendMode: BlendingType;
  /**
   * Color space which will be displayed under hex code and be used in edit
   * mode.
   */
  colorSpace: ColorSpacesType;
}

const initialState: StateType = {
  numOfCards: INIT_NUM_OF_CARDS,
  cards: Array.from({length: INIT_NUM_OF_CARDS},
      (_, i) => newCard(i, INIT_COLOR_SPACE)),
  sortBy: "random",
  isReordering: false,
  isEditingPlt: false,
  blendMode: "mean",
  colorSpace: INIT_COLOR_SPACE,
};

const cardSlice = createSlice({
  name: "plt",
  initialState,
  reducers: {
    // Card actions
    addCard: (state, action: {
      payload: {
        idx: number;
        rgb: number[];
      };
      type: string;
    }) => {
      if (state.numOfCards == MAX_NUM_OF_CARDS) return state;
      const {idx, rgb} = action.payload;
      const cards = state.cards;
      const cardState = newCard(idx, state.colorSpace, rgb);
      cards.forEach((card) => {
        if (card.order >= idx) card.order += 1;
      });
      cards.splice(idx, 0, cardState);
      state.numOfCards = cards.length;
    },
    delCard: (state, action: {
      payload: number;
      type: string;
    }) => {
      if (state.numOfCards === 2) return state;
      const idx = action.payload;
      const removedOrder = state.cards.splice(idx, 1)[0].order;
      state.numOfCards = state.numOfCards - 1;
      state.cards.forEach((card) => {
        if (card.order > removedOrder) card.order -= 1;
      });
    },
    refreshCard: (state, action: {
      payload: number;
      type: string;
    }) => {
      const idx = action.payload;
      if (idx >= 0 && !state.cards[idx].isLock) {
        state.cards[idx] = newCard(state.cards[idx].order, state.colorSpace);
      } else if (idx === -1) {
        for (let i = 0; i < state.numOfCards; i++) {
          if (state.cards[i].isLock) continue;
          state.cards[i] = newCard(state.cards[i].order, state.colorSpace);
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
      const {inverter} = getSpaceTrans(state.colorSpace);
      state.cards[idx].hex = rgb2hex(inverter(color));
      state.cards[idx].color = color;
      state.sortBy = "random";
    },
    sortCards: (state, action: {
      payload: SortActionType;
      type: string;
    }) => {
      const sortBy = action.payload;
      const {inverter} = getSpaceTrans(state.colorSpace);
      switch (sortBy) {
        case "gray":
          if (state.sortBy === "gray") state.cards.reverse();
          else {
            state.cards.sort((a, b) => {
              return rgb2gray(inverter(a.color)) - rgb2gray(inverter(b.color));
            });
            state.sortBy = "gray";
          }
          break;
        case "inversion":
          /**
           * Inversion will not change sortBy. For example, if cards are sorted
           * by gray (brightness), inversion just change most lightest card on
           * left side or on right side.
           */
          state.cards.reverse();
          break;
        case "random":
          shuffle(state.cards);
          state.sortBy = "random";
      }
      state.cards.forEach((card, i) => card.order = i);
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
      const {init, final} = action.payload;
      const initOrder = state.cards[init].order;
      if (initOrder <= final) {
        state.cards.forEach((card) => {
          if (card.order > initOrder && card.order <= final) card.order -= 1;
        });
      } else {
        state.cards.forEach((card) => {
          if (card.order >= final && card.order < initOrder) card.order += 1;
        });
      }
      state.cards[init].order = final;
      state.sortBy = "random";
    },
    // Plt state
    resetOrder: (state) => {
      state.cards.sort((a, b) => a.order - b.order);
      state.cards.forEach((card, i) => card.order = i);
    },
    setIsReordering: (state, action: {
      payload: boolean;
      type: string;
    }) => {
      const newVal = action.payload;
      state.isReordering = newVal;
    },
    setPltIsEditing: (state, action: {
      payload: "start" | "reset" | "cancel";
      type: string;
    }) => {
      const val = action.payload;
      state.isEditingPlt = val !== "cancel";
      if (val === "start") {
        state.cards.forEach((val, i) => {
          state.cards[i].originHex = val.hex;
          state.cards[i].originColor = val.color;
        });
      } else { // "reset" and "cancel"
        state.cards.forEach((val, i) => {
          state.cards[i].hex = val.originHex;
          state.cards[i].color = val.originColor;
        });
      }
    },
    setPlt: (state, action: {
      payload: string[];
      type: string;
    }) => {
      const plt = action.payload;
      state.cards = plt.map((hex, i) => newCard(
          i, state.colorSpace, hex2rgb(hex) as number[],
      ));
      state.numOfCards = plt.length;
      state.sortBy = "random";
    },
    setColorSpace: (state, action: {
      payload: ColorSpacesType;
      type: string;
    }) => {
      const {inverter} = getSpaceTrans(state.colorSpace); // Convert to RGB.
      // Convert to target space.
      const {converter} = getSpaceTrans(action.payload);
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
    adjustContrast: (state, action: {
      payload: {
        method: string;
        gamma?: number;
      };
      type: string;
    }) => {
      if (!state.isEditingPlt) return state;
      const {method, gamma} = action.payload;
      const {converter, inverter} = getSpaceTrans(state.colorSpace);
      const originRgbs = state.cards.map((card) => inverter(card.originColor));
      let newRgbs = originRgbs;
      switch (method) {
        case "multiplication":
          newRgbs = scaling(originRgbs, gamma as number) as number[][];
          break;
        case "gamma":
          newRgbs = gammaCorrection(originRgbs, gamma as number) as number[][];
          break;
      }
      for (let i = 0; i < state.numOfCards; i++) {
        state.cards[i].color = converter(newRgbs[i]);
        state.cards[i].hex = rgb2hex(newRgbs[i]);
      }
    },
  },
});

export const {
  addCard, delCard, refreshCard, editCard, sortCards, setIsLock, setIsEditing,
  moveCard, setIsReordering, setPltIsEditing, setPlt, setColorSpace,
  setBlendMode, adjustContrast, resetOrder,
} = cardSlice.actions;
export default cardSlice.reducer;
