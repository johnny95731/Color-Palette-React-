import {createSlice} from "@reduxjs/toolkit";
// Types
import {
  ColorSpacesType, MixingModeType,
} from "../types/optionsType.ts";

/**
 * The initial state about options.
 * @property {SuportColorSpacesType} editMode - Color space which will be
 *   display under hex code and be used in edit mode.
 * @property {SuportMixingModeType} mixingMode - How to evaluate a new color
 *   when insert a new card.
 */
const initialState: {
  editingMode: ColorSpacesType;
  mixingMode: MixingModeType;
} = {
  /**
   * Color space which will be display under hex code and be used in edit mode.
   */
  editingMode: "rgb",
  /**
   * How to evaluate a new color when insert a new card.
   */
  mixingMode: "mean",
};

const optionSlice = createSlice({
  name: "options",
  initialState,
  reducers: {
    editModeChanged: (state, action: {
      payload: {newMode: ColorSpacesType;};
      type: string;
    }) => {
      const {newMode: newVal} = action.payload;
      state["editingMode"] = newVal;
    },
    mixingModeChanged: (state, action: {
      payload: {newMode: MixingModeType;};
      type: string;
    }) => {
      state.mixingMode = action.payload.newMode;
    },
  },
});

export const {editModeChanged, mixingModeChanged} = optionSlice.actions;
export default optionSlice.reducer;
