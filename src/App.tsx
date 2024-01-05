import React, {
  useRef, useState, useCallback, useMemo, useEffect, useContext,
} from "react";

import Header from "./components/Header";
import Card from "./components/Card";
import FavSidebar from "./components/FavOffcanvas/index.tsx";
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
  const {isSmall} = useContext(MediaContext);

  const positions = useMemo(() => {
    const step = 100 / numOfCards;
    const dir = isSmall ? "top" : "left";

    return Array.from({length: numOfCards + 1}, (_, i) => {
      const style: {[key: string]: string} = {};
      style[dir] = `${i * step}%`;
      return style;
    });
  }, [numOfCards, isSmall]);

  // Events
  const handleAddCard = useCallback((idx: number) => {
    dispatch(addCard({
      idx,
      mixingMode: optionsState.mixingMode,
      editingMode: optionsState.editingMode,
    }));
  }, [optionsState.mixingMode, optionsState.editingMode]);

  return (
    Array.from({length: numOfCards + 1}, (_, i) => {
      return (
        <div key={`insert${i}`}
          tabIndex={-1}
          className={css.insertContainer}
          style={positions[i]}
        >
          <div
            onClick={() => handleAddCard(i)}
          >
            <Icon type={"insertRight"} />
          </div>
        </div>
      );
    })
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
  const {windowSize, isSmall, pos, clientPos} = useContext(MediaContext);

  const {cardLength, cardsPos} = useMemo(() => {
    const cardLength = (isSmall ? windowSize[0] : windowSize[1]) / numOfCards;
    return {
      cardLength,
      cardsPos: Array.from({length: numOfCards},
          (_, i) => Math.floor(i * cardLength),
      ),
    };
  }, [...windowSize, numOfCards]);

  // Drag events
  /**
   * The event is triggered when the `<->` icon on a card is dragging.
   * @param {React.MouseEvent<HTMLDivElement>} e Mouse down event.
   * @param {number} cardId The n-th card.
   */
  const handleDraggingCard = useCallback((
      e: React.MouseEvent<HTMLDivElement>,
      cardId: number,
  ) => {
    if (!cardRefs.current) return;
    const nowPos = e[clientPos]; // Cursor position when mouse down.
    dispatch(setIsReordering(true)); // start
    cardRefs.current.nowDragging = cardId;
    const card = cardRefs.current[cardId];
    card.classList.add(css.dragging);
    card.style[pos] = `${nowPos - cardsPos[cardId]}px`;
  }, [numOfCards]);

  /**
   * The event is triggered when the `<->` icon on a card is dragging and mouse
   * is moving.
   * @param {MouseEvent} e Mouse move event.
   */
  const handleMouseMove = useCallback((e: MouseEvent) => {
    const prevIdx = cardRefs.current.nowDragging;
    if (prevIdx === null) return;
    const nowPos = e[clientPos];
    const card = cardRefs.current[prevIdx];
    // Index of card that cursor at.
    const nowIdx = Math.floor(nowPos / cardLength);
    if (prevIdx !== nowIdx) {
      // Reset prev dragging card.
      card.style[pos] = "";
      card.classList.remove(css.dragging);
      // Set current dragging card.
      cardRefs.current.nowDragging = nowIdx;
      cardRefs.current[nowIdx].classList.add(css.dragging);
      cardRefs.current[nowIdx].style[pos] = `${nowPos - cardsPos[nowIdx]}px`;
      dispatch(moveCard({init: prevIdx, final: nowIdx}));
    } else {
      card.style[pos] = `${nowPos - cardsPos[prevIdx]}px`;
    }
  }, [numOfCards, windowSize[1]]);

  /**
   * The event is triggered when release left buton.
   */
  const handleMouseUp = useCallback(() => {
    const nowIdx = cardRefs.current.nowDragging;
    if (nowIdx == null) return;
    const card = cardRefs.current[nowIdx];
    // Reset dragging card.
    card.style[pos] = "";
    card.classList.remove(css.dragging);
    dispatch(setIsReordering(false));
    cardRefs.current.nowDragging = null;
  }, []);
  // Drag events

  useEffect(() => {
    const body = document.body;
    body.addEventListener("mousemove", handleMouseMove);
    body.addEventListener("mouseup", handleMouseUp);
    return () => {
      body.removeEventListener("mousemove", handleMouseMove);
      body.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  return (
    <div className={css.main}>
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
    </div>
  );
};

// Main component
const App = () => {
  // States / consts
  const cardState = useAppSelector(selectCard);
  const [favShowing, setFavShowing] = useState(() => false);
  const dispatch = useAppDispatch();

  const someCardIsEditing = cardState.cards.some((card) => card.isEditing);

  const favShowingChanged = useCallback(() => {
    setFavShowing((prev) => !prev);
  }, []);

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

  useEffect(() => {
    // Load database and initialize state.
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
      <FavSidebar
        isShowing={favShowing}
        favShowingChanged={favShowingChanged}
      />
    </MediaProvider>
  );
};
export default App;
