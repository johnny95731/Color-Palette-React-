import {createSlice} from "@reduxjs/toolkit";
// Types
import {
  ColorSpacesType, BlendingType,
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
  mixingMode: BlendingType;
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
      payload: ColorSpacesType;
      type: string;
    }) => {
      state.editingMode = action.payload;
    },
    mixingModeChanged: (state, action: {
      payload: BlendingType;
      type: string;
    }) => {
      state.mixingMode = action.payload;
    },
  },
});

export const {editModeChanged, mixingModeChanged} = optionSlice.actions;
export default optionSlice.reducer;
