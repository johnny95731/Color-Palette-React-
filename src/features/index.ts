import {TypedUseSelectorHook, useDispatch, useSelector} from "react-redux";
import {configureStore} from "@reduxjs/toolkit";
import cardSlice from "./slices/pltSlice";
import favSlice from "./slices/favSlice";
import settingsSlice from "./slices/settingsSlice";

const store = configureStore({
  reducer: {
    plt: cardSlice,
    favorites: favSlice,
    settings: settingsSlice,
  },
});

// Typing
type RootState = ReturnType<typeof store.getState>;
type AppDispatch = typeof store.dispatch;
type DispatchFunc = () => AppDispatch
// Hooks
export const useAppDispatch: DispatchFunc = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// Seloctors
export const selectPlt = (state: RootState) => state.plt;
export const selectFavorites = (state: RootState) => state.favorites;
export const selectSettings = (state: RootState) => state.settings;

export default store;
