import {createSlice} from "@reduxjs/toolkit";
// Types
import {ColorSpacesType, BlendingType} from "../types/optionsType.ts";

/**
 * The initial state about options.
 * @property {SuportMixingModeType} blendMode - How to evaluate a new color
 *   when insert a new card.
 * @property {SuportColorSpacesType} colorSpace - Color space which will be
 *   display under hex code and be used in edit mode.
 */
const initialState: {
  blendMode: BlendingType;
  colorSpace: ColorSpacesType;
} = {
  /**
   * How to evaluate a new color when insert a new card.
   */
  blendMode: "mean",
  /**
   * Color space which will be display under hex code and be used in edit mode.
   */
  colorSpace: "rgb",
};

const optionSlice = createSlice({
  name: "options",
  initialState,
  reducers: {
    editModeChanged: (state, action: {
      payload: ColorSpacesType;
      type: string;
    }) => {
      state.colorSpace = action.payload;
    },
    mixingModeChanged: (state, action: {
      payload: BlendingType;
      type: string;
    }) => {
      state.blendMode = action.payload;
    },
  },
});

export const {editModeChanged, mixingModeChanged} = optionSlice.actions;
export default optionSlice.reducer;
