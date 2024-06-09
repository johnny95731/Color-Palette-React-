import { useState, useMemo, useEffect, useCallback, useRef, useLayoutEffect } from 'react';

import Header from './components/Header';
import Palette from './components/Palette';
import SettingDialog from './components/SettingDialog';
import FavOffcanvas from './components/FavOffcanvas';
import './App.module.scss';
// Stores
import { useAppDispatch, useAppSelector, selectPlt } from './features';
import {
  refreshCard, setIsAdjustingPlt, setEditingIdx, sortCards,
} from 'slices/pltSlice.ts';
import { initColors, initPlts } from './features/slices/favSlice.ts';
import MediaProvider from './features/MediaProvider.tsx';
// Types
import type { SortActionType } from 'types/pltType.ts';


// Main component
const App = () => {
  // States / consts
  const dispatch = useAppDispatch();
  // -Display page.
  const [isSettingsShowing, setIsSettingsShowing] = useState(() => false);
  const [isfavShowing, setFavShowing] = useState<boolean>(() => false);
  const [isShowOverlay, setIsShowOverlay] = useState<boolean>(() => false);
  const isEditing = useRef(false);
  /**
   * For blocking keyboard event when
   *  1. 
   */
  const isDuringEvent = useRef<boolean>(true);
  const { editingIdx, isPending } = useAppSelector(selectPlt);
  isEditing.current = editingIdx !== -1;
  isDuringEvent.current = (
    isEditing.current ||
    isPending ||
    isShowOverlay
  );

  useLayoutEffect(() => {
    setIsShowOverlay(isEditing.current);
  }, [isEditing.current]);

  const handleClickMask = useCallback(() => {
    setIsSettingsShowing(false);
    if (isEditing.current) {
      dispatch(setEditingIdx());
      return;
    }
    dispatch(setIsAdjustingPlt('cancel'));
    setFavShowing(false);
    setIsShowOverlay(false);
  }, []);
  const showSettings = () => {
    setIsSettingsShowing(!isSettingsShowing);
    setIsShowOverlay(!isSettingsShowing);
    dispatch(setIsAdjustingPlt('cancel'));
  };
  const showFavOffcanvas = () => {
    setFavShowing(!isfavShowing);
    setIsShowOverlay(!isfavShowing);
  };

  const { refreshPlt, sortPlt } = useMemo(() => {
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
    document.body.classList.remove('preload');
    // Connect hotkey.
    const keyDownEvent = (e: KeyboardEvent) => {
      // Prevent trigger hotkey/shortcut when editing card.
      if (isDuringEvent.current || e.ctrlKey || e.altKey || e.shiftKey) return;
      switch (e.key.toLowerCase()) {
      case ' ':
        refreshPlt();
        break;
      case 'g':
        sortPlt('gray');
        break;
      case 'r':
        sortPlt('random');
        break;
      case 'i':
        sortPlt('inversion');
        break;
      }
    };
    document.body.addEventListener('keydown', keyDownEvent);
    return () => document.body.removeEventListener('keydown', keyDownEvent);
  }, []);
  return (
    <MediaProvider>
      <Header
        refreshPlt={refreshPlt}
        sortPlt={sortPlt}
        showSettings={showSettings}
        showFavOffcanvas={showFavOffcanvas}
      />
      <Palette />
      <div id="overlay"
        style={{
          display: isShowOverlay ? undefined : 'none',
          backgroundColor: isEditing.current ? 'transparent' : undefined,
        }}
        onClick={handleClickMask}
      />
      <>
        {
          isSettingsShowing &&
          <SettingDialog showingChanged={showSettings}/>
        }
        <FavOffcanvas
          isShowing={isfavShowing}
          showingChanged={showFavOffcanvas}
        />
      </>
    </MediaProvider>
  );
};
export default App;
