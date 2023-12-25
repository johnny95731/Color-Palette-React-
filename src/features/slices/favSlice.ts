import {createSlice, createAsyncThunk} from "@reduxjs/toolkit";
import {get, update} from "idb-keyval";

import {
  favoritesDb, FAV_COLORS, FAV_PLTS,
} from "../../common/utils/database.ts";

export const initializeColors = createAsyncThunk("favorites/initializeColors",
    () => get<string[] | undefined>(FAV_COLORS, favoritesDb),
);
export const initializePlts = createAsyncThunk("favorites/initializePlts",
    () => get<string[] | undefined>(FAV_PLTS, favoritesDb),
);


const initialState: {
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
  isInitialized: [boolean, boolean];
} = {
  colors: [],
  plts: [],
  isInitialized: [false, false],
};

const favSlice = createSlice({
  name: "favorites",
  initialState,
  reducers: {
    favColorsChanged: (state, action:{
      payload: {targetHex: string;};
      type: string;
    }) => {
      const {targetHex} = action.payload;
      const isIncluding = state.plts.includes(targetHex);
      // Update database
      update<string[]>(FAV_COLORS, (prev) => {
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
        state.plts = state.plts.filter((hex) => hex != targetHex);
      } else { // Non-Favoriting => Favoriting
        state.plts.push(targetHex);
      }
    },
    favPltsChanged: (state, action:{
      payload: {targetPlt: string;};
      type: string;
    }) => {
      const {targetPlt} = action.payload;
      // Update database
      update<string[]>(FAV_PLTS, (prev) => {
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
        // initializeColors
        .addCase(initializeColors.fulfilled, (state, action) => {
          const colors = action.payload;
          if (!colors) { // First time enter this site.
            update<string[]>(FAV_COLORS, () => [], favoritesDb);
          } else {
            state.colors = colors;
          }
          state.isInitialized[0] = true;
        })
        .addCase(initializeColors.rejected, (state, action) => {
          console.error(action.error.message);
        })
        // initializePlts
        .addCase(initializePlts.fulfilled, (state, action) => {
          const plts = action.payload;
          if (!plts) { // First time enter this site.
            update<string[]>(FAV_PLTS, () => [], favoritesDb);
          } else {
            state.plts = plts;
          }
          state.isInitialized[1] = true;
        })
        .addCase(initializePlts.rejected, (state, action) => {
          console.error(action.error.message);
          state.isInitialized[1] = false;
        });
  },
});

export const {favColorsChanged, favPltsChanged} = favSlice.actions;
export default favSlice.reducer;

