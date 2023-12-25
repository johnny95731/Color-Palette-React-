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
import {
  addCard, moveCard,
} from "./features/slices/cardSlice.ts";
import {initializeColors, initializePlts} from "./features/slices/favSlice.ts";
// Types
import {MouseEventHandler} from "./common/types/eventHandler.ts";


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
    dispatch(addCard({idx, mixingMode: optionsState.mixingMode}));
  }, [optionsState.mixingMode]);

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
// -Main region
const Cards = () => {
  // States / consts
  const cardState = useAppSelector(selectCard);
  const dispatch = useAppDispatch();
  const cardRefs = useRef<{
      dragging: number | null;
      [key: number]: HTMLDivElement;
    }>({dragging: null});
  const totalNum = cardState.numOfCards;
  const viewportWidth = window.innerWidth;
  const [dir, pageLength, clientPos] = useMemo(() => {
    const body = document.body;
    if (viewportWidth > 900) { // Horizontal flow.
      return ["left", body.clientWidth, "clientX"] as const;
    } else { // Vertical flow.
      return ["top", body.clientHeight, "clientY"] as const;
    }
  }, [viewportWidth]);

  const cardsPos = useMemo(() => {
    // Get card.getBoundingClientRect()[dir] for each card.
    const step = pageLength / totalNum;
    return Array.from({length: totalNum}, (_, i) => Math.floor(i * step));
  }, [cardState.numOfCards, pageLength]);

  // Events
  const exchange = useCallback((init: number, final: number) => {
    dispatch(moveCard({init, final}));
  }, []);

  /**
   * The event is triggered when you are dragging the <-> icon.
   */
  const handleDragReorder = useCallback((
      e: React.MouseEvent<HTMLDivElement>,
      cardId: number,
  ) => {
    if (!cardRefs.current) return;
    const initPos = e[clientPos]; // Cursor position when mouse down.
    cardRefs.current.dragging = cardId;
    const card = cardRefs.current[cardId];
    card.classList.add(css.dragging);
    card.style[dir] = `${initPos - cardsPos[cardId]}px`;
  }, [totalNum]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!cardRefs.current) return;
    const prevIdx = cardRefs.current.dragging;
    if (prevIdx === null) return;
    const nowPos = e[clientPos];
    const card = cardRefs.current[prevIdx];
    const cardLength = pageLength / totalNum;
    card.style[dir] = `${nowPos - cardsPos[prevIdx]}px`;
    // Index of card that cursor at.
    const nowIdx = Math.floor(nowPos / cardLength);
    if (prevIdx !== nowIdx) {
      card.style[dir] = "";
      card.classList.remove(css.dragging);
      cardRefs.current.dragging = nowIdx;
      cardRefs.current[nowIdx].classList.add(css.dragging);
      cardRefs.current[nowIdx].style[dir] = `${nowPos - cardsPos[nowIdx]}px`;
      exchange(prevIdx, nowIdx);
    }
  }, [totalNum, viewportWidth]);

  const handleMouseUp = useCallback(() => {
    const nowIdx = cardRefs.current.dragging;
    if (nowIdx == null) return;
    const card = cardRefs.current[nowIdx];
    // Reset card position
    card.style[dir] = "";
    card.classList.remove(css.dragging);
    cardRefs.current.dragging = null;
  }, [viewportWidth]);

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
          handleDragReorder={
            ((e: React.MouseEvent<HTMLDivElement>) =>
              handleDragReorder(e, i)) as MouseEventHandler
          }
        />;
      })}
      <InsertRegions totalNum={cardState.numOfCards} />
    </div>
  );
};

// Main component
const App = () => {
  // Load database
  const [favShowing, setFavShowing] = useState(() => false);
  const dispatch = useAppDispatch();

  const favShowingChanged = useCallback(() => {
    setFavShowing((prev) => !prev);
  }, []);

  useEffect(() => {
    dispatch(initializeColors());
    dispatch(initializePlts());
  }, []);

  return (
    <>
      <Header
        favShowingChanged={favShowingChanged}
      />
      <Cards />
      <FavSidebar
        isShowing={favShowing}
        favShowingChanged={favShowingChanged}
      />
    </>
  );
};
export default App;
