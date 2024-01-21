import {TypedUseSelectorHook, useDispatch, useSelector} from "react-redux";
import {configureStore} from "@reduxjs/toolkit";
import cardSlice from "./slices/pltSlice";
import optionsSlice from "./slices/optionsSlice";
import favSlice from "./slices/favSlice";

const store = configureStore({
  reducer: {
    plt: cardSlice,
    options: optionsSlice,
    favorites: favSlice,
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
export const selectOptions = (state: RootState) => state.options;
export const selectFavorites = (state: RootState) => state.favorites;

export default store;
