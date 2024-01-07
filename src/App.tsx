import React, {
  useRef, useState, useCallback, useMemo, useEffect, useContext,
} from "react";

import Header from "./components/Header";
import Card from "./components/Card";
import FavOffcanvas from "./components/FavOffcanvas/index.tsx";
import Icon from "./components/Icons";
import css from "./App.scss";
// Redux / Context
import {useAppDispatch, useAppSelector} from "./common/hooks/storeHooks.ts";
import {selectCard, selectOptions} from "./features/store.ts";
import type {AppDispatch} from "./features/store.ts";
import {
  addCard, moveCard, refreshCard, setIsReordering, sortCards,
} from "./features/slices/cardSlice.ts";
import {initializeColors, initializePlts} from "./features/slices/favSlice.ts";
import MediaProvider from "./features/MediaProvider.tsx";
import MediaContext from "./features/mediaContext.ts";
// Types
import {MouseHandler} from "./common/types/eventHandler.ts";
import {SortActionType} from "./features/types/cardType.ts";


// Other components
const InsertRegions = ({
  numOfCards,
}: {
  numOfCards: number;
}) => {
  // States / consts
  const optionsState = useAppSelector(selectOptions);
  const dispatch = useAppDispatch();
  const {isSmall, pos} = useContext(MediaContext);

  const positions = useMemo(() => {
    const step = 100 / numOfCards;

    return Array.from({length: numOfCards + 1}, (_, i) => {
      const style: {[key: string]: string} = {};
      style[pos] = `${i * step}%`;
      return style;
    });
  }, [numOfCards, isSmall]);

  // Events
  const handleAddCard = useCallback((idx: number) => {
    dispatch(addCard({
      idx,
      blendMode: optionsState.blendMode,
      editingMode: optionsState.colorSpace,
    }));
  }, [optionsState.blendMode, optionsState.colorSpace]);

  return (
    <div id="insertRegion">
      {Array.from({length: numOfCards + 1}, (_, i) => {
        return (
          <div key={`insert${i}`}
            tabIndex={-1}
            className={css.insertWrapper}
            style={positions[i]}
          >
            <div
              onClick={() => handleAddCard(i)}
            >
              <Icon type={"insert"} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

const DisplayRegion = ({
  dispatch,
}: {
  dispatch: AppDispatch;
}) => {
  // States / consts
  const cardState = useAppSelector(selectCard);
  const cardRefs = useRef<{
      nowDragging: number | null;
      [key: number]: HTMLDivElement;
    }>({nowDragging: null});
  const numOfCards = cardState.numOfCards;
  const {windowSize, isSmall, pos, clientPos, bound} = useContext(MediaContext);

  const {cardLength, cardsPos} = useMemo(() => {
    const cardLength = (
      ((isSmall ? windowSize[0] : windowSize[1]) - bound[0]) / numOfCards
    );
    return {
      cardLength,
      cardsPos: Array.from({length: numOfCards},
          (_, i) => bound[0] + Math.floor(i * cardLength),
      ),
    };
  }, [...windowSize, numOfCards]);

  // Drag events start
  /**
   * The event is triggered when the `<->` icon on a card is dragging.
   * @param {number} cardId The n-th card.
   */
  const handleDraggingCard = useCallback((
      e: React.MouseEvent | React.TouchEvent,
      cardId: number,
  ) => {
    if (!cardRefs.current) return;
    // Disable pull-to-refresh on mobile.
    document.body.style.overscrollBehavior = "none";
    // Cursor position when mouse down.
    const nowPos = (
      (e as React.MouseEvent)[clientPos] ||
      (e as React.TouchEvent).touches[0][clientPos]
    );
    dispatch(setIsReordering(true));
    cardRefs.current.nowDragging = cardId;
    const card = cardRefs.current[cardId];
    card.classList.add(css.dragging);
    card.style[pos] = `${nowPos - cardsPos[cardId]}px`;
  }, [numOfCards, isSmall]);

  /**
   * The event is triggered when the `<->` icon on a card is dragging and mouse
   * is moving.
   */
  const handleMouseMove = useCallback((e: MouseEvent | TouchEvent) => {
    const prevIdx = cardRefs.current.nowDragging;
    if (prevIdx === null) return;
    const nowPos = e.type === "touchmove" ?
        (e as TouchEvent).touches[0][clientPos] :
        (e as MouseEvent)[clientPos];
    // Mouse is not in range.
    if (nowPos < bound[0] || nowPos > bound[1]) return;
    let card = cardRefs.current[prevIdx];
    // Index of card that cursor at.
    const nowIdx = Math.floor((nowPos - bound[0]) / cardLength);
    if (prevIdx !== nowIdx) {
      // Reset prev dragging card.
      card.style[pos] = "";
      card.classList.remove(css.dragging);
      // Set current dragging card.
      card = cardRefs.current[nowIdx];
      cardRefs.current.nowDragging = nowIdx;
      card.classList.add(css.dragging);
      dispatch(moveCard({init: prevIdx, final: nowIdx}));
    }
    card.style[pos] = `${nowPos - cardsPos[nowIdx]}px`;
  }, [numOfCards, cardLength, isSmall]);

  /**
   * The event is triggered when release left buton.
   */
  const handleMouseUp = useCallback(() => {
    // Able pull-to-refresh on mobile.
    document.body.style.overscrollBehavior = "";

    const nowIdx = cardRefs.current.nowDragging;
    if (nowIdx == null) return;
    const card = cardRefs.current[nowIdx];
    // Reset dragging card.
    card.style[pos] = "";
    card.classList.remove(css.dragging);
    dispatch(setIsReordering(false));
    cardRefs.current.nowDragging = null;
  }, [isSmall]); // pos depends on isSmall.

  useEffect(() => {
    const body = document.body;
    body.addEventListener("mousemove", handleMouseMove);
    body.addEventListener("mouseup", handleMouseUp);
    body.addEventListener("touchmove", handleMouseMove);
    body.addEventListener("touchend", handleMouseUp);
    return () => {
      body.removeEventListener("mousemove", handleMouseMove);
      body.removeEventListener("mouseup", handleMouseUp);
      body.removeEventListener("touchmove", handleMouseMove);
      body.removeEventListener("touchend", handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);
  // Drag events end

  return (
    <main className={css.main}>
      {cardState.cards.map((card, i) => {
        return <Card key={`card${i}`}
          ref={(el) => cardRefs.current[i] = (el as HTMLDivElement)}
          cardId={i}
          numOfCards={numOfCards}
          card={card}
          handleDraggingCard={
            ((e: React.MouseEvent<HTMLDivElement>) =>
              handleDraggingCard(e, i)) as MouseHandler
          }
        />;
      })}
      <InsertRegions numOfCards={cardState.numOfCards} />
    </main>
  );
};

// Main component
const App = () => {
  // States / consts
  const cardState = useAppSelector(selectCard);
  const [isfavShowing, setFavShowing] = useState(() => false);
  const [isMaskBg, setIsMaskBg] = useState(() => false);
  const dispatch = useAppDispatch();

  const someCardIsEditing = cardState.cards.some((card) => card.isEditing);

  const favShowingChanged = useCallback(() => {
    setFavShowing((prev) => !prev);
    setIsMaskBg(!isfavShowing);
  }, [isfavShowing]);

  const {
    refresh, handleSorting,
  } = useMemo(() => {
    return {
      refresh: () => {
        dispatch(refreshCard(-1));
      },
      handleSorting: (sortBy: SortActionType) => {
        dispatch(sortCards(sortBy));
      },
    };
  }, []);

  // Load database and initialize state.
  useEffect(() => {
    dispatch(initializeColors());
    dispatch(initializePlts());
  }, []);

  useEffect(() => {
    // Connect hotkey.
    const body = document.body;
    const keyDownEvent = (e: KeyboardEvent) => {
      // Prevent trigger hotkey/shortcut when editing card.
      if (someCardIsEditing) return;

      switch (e.key.toLowerCase()) {
        case " ":
          refresh();
          break;
        case "g":
          handleSorting("gray");
          break;
        case "r":
          handleSorting("random");
          break;
        case "i":
          handleSorting("inversion");
          break;
      }
    };
    body.addEventListener("keydown", keyDownEvent);
    return () => body.removeEventListener("keydown", keyDownEvent);
  }, [someCardIsEditing]);

  return (
    <MediaProvider>
      <Header
        refresh={refresh}
        handleSorting={handleSorting}
        favShowingChanged={favShowingChanged}
      />
      <DisplayRegion dispatch={dispatch} />
      <div id="mask"
        onClick={favShowingChanged}
        style={{
          display: isMaskBg ? undefined : "none",
        }}
      />
      <FavOffcanvas
        isShowing={isfavShowing}
        favShowingChanged={favShowingChanged}
      />
    </MediaProvider>
  );
};
export default App;
