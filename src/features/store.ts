import {configureStore} from "@reduxjs/toolkit";
import cardSlice from "./slices/cardSlice";
import optionsSlice from "./slices/optionsSlice";
import favSlice from "./slices/favSlice";

const store = configureStore({
  reducer: {
    card: cardSlice,
    options: optionsSlice,
    favorites: favSlice,
  },
});
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const selectCard = (state: RootState) => state.card;
export const selectOptions = (state: RootState) => state.options;
export const selectFavorites = (state: RootState) => state.favorites;

export default store;
