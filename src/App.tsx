import React, {
  useRef, useState, useCallback, useMemo, useEffect,
} from "react";

import Header from "./components/Header";
import Card from "./components/Card";
import FavSidebar from "./components/FavColors";
import Icon from "./components/Icons";
import css from "./App.scss";
// Redux-related
import {useAppDispatch, useAppSelector} from "./common/hooks/storeHooks.ts";
import {selectCard, selectOptions} from "./features/store.ts";
import type {AppDispatch} from "./features/store.ts";
import {
  addCard, moveCard, refreshCard, setIsReordering, sortCards,
} from "./features/slices/cardSlice.ts";
import {initializeColors, initializePlts} from "./features/slices/favSlice.ts";
// Types
import {MouseEventHandler} from "./common/types/eventHandler.ts";
import {SortActionType} from "./features/types/cardType.ts";


// Other components
const InsertRegions = ({
  totalNum, // total num of cards.
}: {
  totalNum: number;
}) => {
  // States / consts
  const optionsState = useAppSelector(selectOptions);
  const dispatch = useAppDispatch();
  const viewportWidth = window.innerWidth;

  const positions = useMemo(() => {
    const step = 100 / totalNum;
    const dir = viewportWidth > 900 ? "left" : "top";

    return Array.from({length: totalNum + 1}, (_, i) => {
      const style: {[key: string]: string} = {};
      style[dir] = `${i * step}%`;
      return style;
    });
  }, [totalNum, viewportWidth]);

  // Events
  const addCardWrapper = useCallback((idx: number) => {
    dispatch(addCard({
      idx,
      mixingMode: optionsState.mixingMode,
      editingMode: optionsState.editingMode,
    }));
  }, [optionsState.mixingMode, optionsState.editingMode]);

  return (
    Array.from({length: totalNum + 1}, (_, i) => {
      return (
        <div className={css.insertContainer}
          key={`insert${i}`}
          style={positions[i]}
        >
          <div
            onClick={() => addCardWrapper(i)}
          >
            <Icon type={"insertRight"}
            />
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
      initDragging: number | null;
      nowDragging: number | null;
      [key: number]: HTMLDivElement;
    }>({initDragging: null, nowDragging: null});
  const totalNum = cardState.numOfCards;
  const viewportWidth = window.innerWidth;
  const {dir, cardLength, clientPos} = useMemo(() => {
    const body = document.body;
    if (viewportWidth > 900) { // Horizontal flow.
      return {
        dir: "left", clientPos: "clientX",
        cardLength: body.clientWidth / totalNum,
      } as const;
    } else { // Vertical flow.
      return {
        dir: "top", clientPos: "clientY",
        cardLength: body.clientHeight / totalNum,
      } as const;
    }
  }, [viewportWidth, totalNum]);

  const cardsPos = useMemo(() => {
    // Get card.getBoundingClientRect()[dir] for each card.
    return Array.from({length: totalNum}, (_, i) => Math.floor(i * cardLength));
  }, [viewportWidth, totalNum]);

  // Events
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
    dispatch(setIsReordering({newVal: true})); // start
    cardRefs.current.initDragging = cardId;
    cardRefs.current.nowDragging = cardId;
    const card = cardRefs.current[cardId];
    card.classList.add(css.dragging);
    card.style[dir] = `${nowPos - cardsPos[cardId]}px`;
  }, [totalNum]);

  /**
   * The event is triggered when the `<->` icon on a card is dragging and mouse
   * is moving.
   * @param {MouseEvent} e Mouse move event.
   */
  const handleMouseMove = useCallback((e: MouseEvent) => {
    const initIdx = cardRefs.current.initDragging;
    const prevIdx = cardRefs.current.nowDragging;
    if ((initIdx === null) || (prevIdx === null)) return;
    const nowPos = e[clientPos];
    const card = cardRefs.current[prevIdx];
    // Index of card that cursor at.
    const nowIdx = Math.floor(nowPos / cardLength);
    if (prevIdx !== nowIdx) {
      // Reset prev dragging card.
      card.style[dir] = "";
      card.classList.remove(css.dragging);
      // Set current dragging card.
      cardRefs.current.nowDragging = nowIdx;
      cardRefs.current[nowIdx].classList.add(css.dragging);
      cardRefs.current[nowIdx].style[dir] = `${nowPos - cardsPos[nowIdx]}px`;
      dispatch(moveCard({init: prevIdx, final: nowIdx}));
    } else {
      card.style[dir] = `${nowPos - cardsPos[prevIdx]}px`;
    }
  }, [totalNum, viewportWidth]);

  const handleMouseUp = useCallback(() => {
    const nowIdx = cardRefs.current.nowDragging;
    if (nowIdx == null) return;
    const card = cardRefs.current[nowIdx];
    // Reset dragging card.
    card.style[dir] = "";
    card.classList.remove(css.dragging);
    dispatch(setIsReordering({newVal: false}));
    cardRefs.current.initDragging = null;
    cardRefs.current.nowDragging = null;
  }, []);

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
          cardState={card}
          handleDraggingCard={
            ((e: React.MouseEvent<HTMLDivElement>) =>
              handleDraggingCard(e, i)) as MouseEventHandler
          }
        />;
      })}
      <InsertRegions totalNum={cardState.numOfCards} />
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
        dispatch(refreshCard({idx: -1}));
      },
      handleSorting: (sortBy: SortActionType) => {
        dispatch(sortCards({sortBy}));
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
    <>
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
    </>
  );
};
export default App;
