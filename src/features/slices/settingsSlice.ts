import {createSlice} from "@reduxjs/toolkit";
import {hasSameKeys} from "utils/helpers.ts";
import type {BorderStyleType, TransitionType} from "types/settingType.ts";


type StateType = {
  /**
   * Border of cards.
   */
  border: BorderStyleType;
  /**
   * Transition of cards
   */
  transition: TransitionType;
};

const initialState: StateType & {
  /**
   * Whether the `settings` store is loaded.
   */
  isInit: boolean;
} = {
  isInit: false,
  border: {
    show: false,
    width: 2,
    color: "white",
  },
  transition: {
    pos: 200,
    color: 200,
  },
};
// Initialize Settings
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const {isInit, ...state} = initialState;
type stateKey = keyof typeof state;
for (const key of Object.keys(state)) {
  const storageItem = localStorage.getItem(key); // object in storage.
  const initItem = state[key as stateKey];
  // First time loading the page
  if (!storageItem) localStorage.setItem(key, JSON.stringify(initItem));
  // Updating versions may cause different keys.
  else if (!hasSameKeys(initItem, JSON.parse(storageItem))) {
    const storageObj = JSON.parse(storageItem);
    // Save previous value to current state for common attributes.
    for (const itemKey of Object.keys(storageObj)) {
      if (Object.hasOwn(initItem, itemKey)) {
        type attrKey = keyof typeof initItem;
        initItem[itemKey as attrKey] = storageObj[itemKey];
      }
    }
  } else Object.assign(initItem, JSON.parse(storageItem));
}


const settingssSlice = createSlice({
  name: "settings",
  initialState,
  reducers: {
    setBorder(state, action: {
      payload: {
        attr: keyof BorderStyleType;
        val: number | string | boolean;
      };
      type: string;
    }) {
      const {attr, val} = action.payload;
      // @ts-expect-error Ignore checking `attr`.
      state.border[attr] = val;
      // Update store
      localStorage.setItem("border", JSON.stringify(state.border));
    },
    setTransition(state, action: {
      payload: {
        attr: keyof TransitionType;
        val: number;
      };
      type: string;
    }) {
      const {attr, val} = action.payload;
      state.transition[attr] = val;
      // Update store
      localStorage.setItem("transition", JSON.stringify(state.transition));
    },
  },
});

export const {setBorder, setTransition} = settingssSlice.actions;
export default settingssSlice.reducer;
