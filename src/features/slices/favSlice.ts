import {createSlice, createAsyncThunk} from "@reduxjs/toolkit";
import {get, update, set} from "idb-keyval";

import {
  favoritesDb, STORE_FAV_COLORS, STORE_FAV_PLTS,
} from "@/common/utils/database.ts";


export const initColors = createAsyncThunk("favorites/initColors",
    () => get<string[]>(STORE_FAV_COLORS, favoritesDb),
);
export const initPlts = createAsyncThunk("favorites/initPlts",
    () => get<string[]>(STORE_FAV_PLTS, favoritesDb),
);

type stateType = {
  /**
   * Favorite colors.
   */
  colors: string[];
  /**
   * Favorite palettes(plts).
   */
  plts: string[];
  /**
   * Whether the colors/plts is loaded.
   */
  isInit: [boolean, boolean];
}

const initialState: stateType = {
  colors: [],
  plts: [],
  isInit: [false, false],
};

const favSlice = createSlice({
  name: "favorites",
  initialState,
  reducers: {
    favColorsChanged: (state, action:{
      payload: string;
      type: string;
    }) => {
      const targetHex = action.payload;
      const isIncluding = state.colors.includes(targetHex);
      // Update database
      update<string[]>(STORE_FAV_COLORS, (prev) => {
        if (!prev) return [];
        let newFav: string[];
        if (isIncluding) { // Favoriting => Non-Favoriting
          newFav = prev.filter((hex) => hex != targetHex);
        } else { // Non-Favoriting => Favoriting
          newFav = [...prev];
          newFav.push(targetHex);
        }
        return newFav;
      }, favoritesDb)
          .catch((e) => console.error(e));
      // Update state
      if (isIncluding) { // Favoriting => Non-Favoriting
        state.colors = state.colors.filter((hex) => hex != targetHex);
      } else { // Non-Favoriting => Favoriting
        state.colors.push(targetHex);
      }
    },
    favPltsChanged: (state, action:{
      payload: string;
      type: string;
    }) => {
      const targetPlt = action.payload;
      // Update database
      update<string[]>(STORE_FAV_PLTS, (prev) => {
        if (!prev) return [];
        let newFav: string[];
        if (prev.includes(targetPlt)) { // Favoriting => Non-Favoriting
          newFav = prev.filter((plt) => plt != targetPlt);
        } else { // Non-Favoriting => Favoriting
          newFav = [...prev];
          newFav.push(targetPlt);
        }
        return newFav;
      }, favoritesDb)
          .catch((e) => console.error(e));
      // Update state
      if (state.plts.includes(targetPlt)) { // Favoriting => Non-Favoriting
        state.plts = state.plts.filter((plt) => plt != targetPlt);
      } else { // Non-Favoriting => Favoriting
        state.plts.push(targetPlt);
      }
    },
  },
  extraReducers: (builder) => {
    builder
        // Initialize colors
        .addCase(initColors.fulfilled, (state, action) => {
          const colors = action.payload;
          if (!colors) { // First time enter this site.
            set(STORE_FAV_COLORS, [], favoritesDb);
          } else {
            state.colors = colors;
          }
          state.isInit[0] = true;
        })
        .addCase(initColors.rejected, (state, action) => {
          console.error("Colors store:", action.error.message);
          state.isInit[0] = true;
        })
        // Initialize plts
        .addCase(initPlts.fulfilled, (state, action) => {
          const plts = action.payload;
          if (!plts) { // First time enter this site.
            set(STORE_FAV_PLTS, [], favoritesDb);
          } else {
            state.plts = plts;
          }
          state.isInit[1] = true;
        })
        .addCase(initPlts.rejected, (state, action) => {
          console.error("Palettes store:", action.error.message);
          state.isInit[1] = true;
        });
  },
});

export const {favColorsChanged, favPltsChanged} = favSlice.actions;
export default favSlice.reducer;

