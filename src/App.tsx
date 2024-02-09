import React, {useState, useMemo, useEffect, useCallback} from "react";

import Header from "./components/Header";
import Palette from "./components/Palette";
import SettingDialog from "./components/SettingDialog";
import FavOffcanvas from "./components/FavOffcanvas";
import "./App.scss";
// Stores
import {
  useAppDispatch, useAppSelector, selectPlt,
} from "./features";
import {
  refreshCard, setPltIsEditing, sortCards,
} from "@/features/slices/pltSlice.ts";
import {initColors, initPlts} from "./features/slices/favSlice.ts";
import MediaProvider from "./features/MediaProvider.tsx";
// Types
import type {SortActionType} from "types/pltType.ts";


// Main component
const App = () => {
  // States / consts
  const dispatch = useAppDispatch();
  // -Display page.
  const [isSettingsShowing, setIsSettingsShowing] = useState(() => false);
  const [isfavShowing, setFavShowing] = useState<boolean>(() => false);
  const [isMasking, setIsMasking] = useState<boolean>(() => false);

  const handleClickMask = useCallback(() => {
    setIsSettingsShowing(false);
    dispatch(setPltIsEditing("cancel"));
    setFavShowing(false);
    setIsMasking(false);
  }, []);
  const showSettings = () => {
    setIsSettingsShowing(!isSettingsShowing);
    setIsMasking(!isSettingsShowing);
  };
  const showFavOffcanvas = () => {
    setFavShowing(!isfavShowing);
    setIsMasking(!isfavShowing);
  };

  const {cards, isReordering} = useAppSelector(selectPlt);
  const preventKeydown = (
    cards.some((card) => card.isEditing) ||
    isReordering ||
    isMasking
  );

  const {refreshPlt, sortPlt} = useMemo(() => {
    return {
      refreshPlt: () => {
        dispatch(refreshCard(-1));
      },
      sortPlt: (sortBy: SortActionType) => {
        dispatch(sortCards(sortBy));
      },
    };
  }, []);

  useEffect(() => {
    // Load database and initialize state.
    dispatch(initColors());
    dispatch(initPlts());
    // `preload` class for preventing annimation occurs on page load.
    const body = document.body;
    setTimeout(() => {
      body.classList.remove("preload");
    }, 500);
  }, []);

  useEffect(() => {
    // Connect hotkey.
    const body = document.body;
    const keyDownEvent = (e: KeyboardEvent) => {
      // Prevent trigger hotkey/shortcut when editing card.
      if (preventKeydown) return;

      switch (e.key.toLowerCase()) {
        case " ":
          refreshPlt();
          break;
        case "g":
          sortPlt("gray");
          break;
        case "r":
          sortPlt("random");
          break;
        case "i":
          sortPlt("inversion");
          break;
      }
    };
    body.addEventListener("keydown", keyDownEvent);
    return () => body.removeEventListener("keydown", keyDownEvent);
  }, [preventKeydown]);

  return (
    <MediaProvider>
      <Header
        refreshPlt={refreshPlt}
        sortPlt={sortPlt}
        showSettings={showSettings}
        showFavOffcanvas={showFavOffcanvas}
      />
      <Palette />
      <div id="mask"
        style={{
          display: isMasking ? undefined : "none",
        }}
        onClick={handleClickMask}
      />
      <>{
        isSettingsShowing &&
        <SettingDialog showingChanged={showSettings}/>
      }</>
      <FavOffcanvas
        isShowing={isfavShowing}
        showingChanged={showFavOffcanvas}
      />
    </MediaProvider>
  );
};
export default App;
