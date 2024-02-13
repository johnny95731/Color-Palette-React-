import React, {
  useRef, useMemo, useEffect, useContext, useState, useLayoutEffect,
} from "react";

import Card from "./card.tsx";
import Icon from "../Customs/Icons.tsx";
import css from "./index.scss";
// Utils
import {
  evalLength, evalPosition, round,
} from "@/common/utils/helpers.ts";
import {blenders} from "@/common/utils/blend.ts";
import {INIT_NUM_OF_CARDS, MAX_NUM_OF_CARDS} from "@/common/utils/constants.ts";
import {getSpaceTrans, randRgbGen, rgb2hex} from "@/common/utils/colors.ts";
// Stores
import {
  useAppDispatch, useAppSelector, selectPlt, selectSettings,
} from "@/features";
import {
  addCard, delCard, moveCardOrder, resetOrder, setIsPending,
} from "@/features/slices/pltSlice.ts";
import MediaContext from "@/features/mediaContext.ts";
// Types
import type {CardHandle} from "./card.tsx";

// Other components
const InsertRegions = ({
  positions,
  handleAddCard,
}: {
  positions: string[];
  handleAddCard: (idx: number) => void;
}) => {
  // States / consts
  const {numOfCards, isPending} = useAppSelector(selectPlt);
  const {pos} = useContext(MediaContext);

  const displayStyle = (
    (numOfCards === MAX_NUM_OF_CARDS || isPending) ?
        {display: "none"} :
        undefined
  );
  return (
    <div id="insertRegion"
      style={displayStyle}
    >
      {Array.from({length: numOfCards + 1}, (_, i) => {
        return (
          <div key={`insert${i}`}
            tabIndex={-1}
            className={css.insertWrapper}
            style={{[pos]: positions[i]}}
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


const Palette = () => {
  // States / consts
  const dispatch = useAppDispatch();
  const {
    cards, numOfCards, colorSpace, blendMode,
  } = useAppSelector(selectPlt);
  const {border, transition} = useAppSelector(selectSettings);
  const {windowSize, isSmall, clientPos, bound} = useContext(MediaContext);

  const dragIdx = useRef<{
      /**
       * Index of card in `cards` state.
       */
      draggingIdx: number | null;
      /**
       * Final position(order) that cursor at.
       */
      finalIdx: number | null;
  }>({
    draggingIdx: null, finalIdx: null,
  });
  const cardRefs = useRef<CardHandle[]>([]);

  const borderStyle: React.CSSProperties = {
    borderWidth: border.width,
    borderColor: border.show ? border.color : "",
    transitionDuration: (
      `${transition.pos}ms, ${transition.pos}ms, ${transition.color}ms`
    ),
  };

  const {cardLength, positions} = useMemo(() => {
    const cardLength = (
      ((isSmall ? windowSize[0] : windowSize[1]) - bound[0]) / numOfCards
    );
    return {
      cardLength,
      positions: Array.from({length: numOfCards + 1},
          (_, i) => evalPosition(i, numOfCards),
      ),
    };
  }, [windowSize, numOfCards]);

  // Set style to all cards.
  const {
    resetPosition, removeTransition, resetTransition,
  } = useMemo(() => {
    return {
      /**
       * Set position of card from `start` to `end` with total cards
       * number `total`.
       * @param start The first index that be set position.
       * @param end The final index that be set position.
       * @param total Total number of cards.
       */
      resetPosition(
          start: number = 0, end: number = numOfCards,
          total: number = numOfCards,
      ) {
        for (let i = start; i < end; i++) {
          if (i === dragIdx.current.draggingIdx) continue;
          cardRefs.current[i].setPos(evalPosition(i, total));
        }
      },
      removeTransition() {
        for (let i = 0; i < numOfCards; i++) {
          cardRefs.current[i].setTransDuration("none");
        }
      },
      resetTransition(end: number = numOfCards) {
        for (let i = 0; i < end; i++) {
          if (i === dragIdx.current.draggingIdx) continue;
          cardRefs.current[i].setTransDuration("reset");
        }
      },
    };
  }, [numOfCards]);

  // Add card, remove card, and drag card have transition event.
  // The state is for checking the transition is end.
  const [isInTrans, setIsInTrans] = useState<boolean[]>(() =>
    Array.from({length: INIT_NUM_OF_CARDS}, () => false),
  );
  // After transition end, some side effect will happen. This state is present
  // for checking the entire event and side effect is complete.
  const [isEventEnd, setIsEventEnd] = useState(true);

  const handleTransitionEnd = (cardIdx: number) => {
    setIsInTrans((prev) => {
      const newState = [...prev];
      newState[cardIdx] = false;
      return newState;
    });
  };

  // Transition before adding card.
  /**
   * Infomation that be used in some events like mouseup(dragging end), add a
   * card, or remove card.
   */
  const eventInfo = useRef<{
    event: "mouseup" | "add" | "remove";
    idx?: number;
    rgb?: number[];
  } | null
  >(null);
  const handleAddCard = (idx: number) => {
    // Evaluate new color.
    let rgb;
    if (blendMode === "random") rgb = randRgbGen();
    else {
      const {inverter} = getSpaceTrans(colorSpace);
      // Pick cards.
      let leftRgbColor;
      let rightRgbColor;
      // -Add to the first position. Blending the first card and black.
      if (!idx) leftRgbColor = [0, 0, 0];
      else leftRgbColor = inverter(cards[idx - 1].color);
      // -Add to the last position. Blending the last card and white.
      if (idx === numOfCards) rightRgbColor = [255, 255, 255];
      else rightRgbColor = inverter(cards[idx].color);
      rgb = blenders[blendMode](leftRgbColor, rightRgbColor, colorSpace);
    }
    const length = evalLength(numOfCards + 1);
    if (!transition.pos) { // no transition.
      dispatch(addCard({idx, rgb}));
      removeTransition();
      setTimeout(() => resetTransition(), 50);
      return;
    }
    document.body.style.backgroundColor = rgb2hex(rgb);
    eventInfo.current = {event: "add", idx, rgb};
    // Transition: shrink and move card. The enpty space is new card
    for (let i = 0; i < numOfCards; i++) {
      cardRefs.current[i].setSize(length);
      const bias = i >= idx ? 1 : 0;
      cardRefs.current[i].setPos(
          evalPosition(cards[i].order + bias, numOfCards + 1),
      );
    }
    // Trigger side effect when !isInTrans.some()
    setIsInTrans(Array.from({length: numOfCards}, () => true));
    dispatch(setIsPending(true));
    setIsEventEnd(false);
  };

  // Handle delete card.
  /**
   * Transition before delete card object.
   * @param idx
   */
  const handleRemoveCard = (idx: number) => {
    if (!transition.pos) { // no transition.
      dispatch(delCard(idx));
      removeTransition();
      setTimeout(() => resetTransition(numOfCards - 1), 50);
      return;
    }
    dispatch(setIsPending(true));
    const newLength = evalLength(numOfCards - 1);
    setIsInTrans(Array.from({length: numOfCards - 1}, () => true));
    // Shrink target card and expand other card.
    for (let i = 0; i < numOfCards; i++) {
      if (i === idx) {
        cardRefs.current[i].setSize("0%");
        cardRefs.current[i].setPos(evalPosition(i, numOfCards - 1));
        continue;
      }
      const bias = i > idx ? 1 : 0;
      cardRefs.current[i].setSize(newLength);
      cardRefs.current[i].setPos(evalPosition(i - bias, numOfCards - 1));
    }
    eventInfo.current = {event: "remove", idx};
    setIsEventEnd(false);
  };

  // Drag events start
  const {startDraggingCard, moveCard, endDraggingCard} = useMemo(() => {
    const halfCardLength = cardLength / 2;
    // Rewrite `cursorPos / cardLength` to `cursorPos * cursorRationCoeff`.
    // Since division cost much time than multiplication.
    const cursorRationCoeff = 1 / cardLength;
    const cursorLimited = bound[1] - bound[0];
    let card: CardHandle | null;
    return {
      /**
       * The event is triggered when the `<->` icon on a card is dragging.
       * @param {number} cardIdx The n-th card.
       */
      startDraggingCard(
          e: React.MouseEvent | React.TouchEvent, cardIdx: number,
      ) {
        // Prevent pointer-event.
        if (!e.type.startsWith("touch")) e.preventDefault();
        // Disable pull-to-refresh on mobile.
        document.body.style.overscrollBehavior = "none";
        // Cursor position when mouse down.
        const cursorPos = (
          (e as React.MouseEvent)[clientPos] ||
          (e as React.TouchEvent).touches[0][clientPos]
        ) - bound[0];
        if (transition.pos) {
          setIsInTrans((prev) => {
            const newState = [...prev];
            newState[cardIdx] = true;
            return newState;
          });
        }
        dispatch(setIsPending(true));
        setIsEventEnd(false);
        dragIdx.current.draggingIdx = cardIdx;
        dragIdx.current.finalIdx = cardIdx;
        card = cardRefs.current[cardIdx];
        card.setPos(`${round(cursorPos - halfCardLength)}px`);
        card.setTransDuration("none");
        card.element.classList.add(css.dragging);
      },
      /**
       * The event is triggered when the `<->` icon on a card is dragging and
       * cursor is moving.
       */
      moveCard(e: MouseEvent | TouchEvent) {
        if (!card) return;
        const cursorPos = (
          (e as MouseEvent)[clientPos] ||
          (e as TouchEvent).touches[0][clientPos]
        ) - bound[0];
        // Mouse is not in range.
        if (cursorPos < 0 || cursorPos > cursorLimited) return;
        card.setPos(`${round(cursorPos - halfCardLength)}px`);
        // Order of card that cursor at.
        const order = Math.floor(cursorPos * cursorRationCoeff);
        const idx = dragIdx.current.draggingIdx as number;
        const lastOrder = dragIdx.current.finalIdx as number;
        dragIdx.current.finalIdx = order;
        // Change `.order` attribute.
        dispatch(moveCardOrder({cardIdx: idx, to: order}));
        // Update state: which card start transition.
        if (transition.pos) {
          setIsInTrans((prev) => {
            if (order === lastOrder) return prev;
            const newState = [...prev];
            // No exchange happened
            const moveToRightSide = lastOrder < order;
            if ( // Be away from origin place.
              (order < idx && !moveToRightSide) ||
              (idx < order && moveToRightSide)
            ) {
              newState[order] = true;
            } else { // Close to origin place.
              newState[lastOrder] = true;
            }
            return newState;
          });
        }
      },
      /**
       * The event is triggered when release left buton.
       */
      endDraggingCard() {
        if (!card) return;
        const card_ = card;
        card = null;
        // Able pull-to-refresh on mobile.
        document.body.style.overscrollBehavior = "";
        // `draggingIdx` and `finalIdx`setIsEventEnd are set to be non-null
        // together when mouse down.
        const idx = dragIdx.current.draggingIdx;
        const finalOrder = dragIdx.current.finalIdx as number;
        dragIdx.current.draggingIdx = null;
        dragIdx.current.finalIdx = null;
        if (idx === null) return;
        // Remove class.
        card_.element.classList.remove(css.dragging);
        if (!transition.pos) {
          removeTransition();
          dispatch(resetOrder());
          resetPosition();
          setIsEventEnd(true); // Trigger `resetTransition`;
          return;
        }
        // Dragging card move to target position.
        card_.setPos(evalPosition(finalOrder, numOfCards));
        card_.setTransDuration("reset");
        eventInfo.current = {event: "mouseup"};
      },
    };
  }, [numOfCards, isSmall, bound, transition.pos]);
  useEffect(() => { // When cursor move into another card.
    if (dragIdx.current.finalIdx === null) return;
    for (let i = 0; i < numOfCards; i++) {
      if (i === dragIdx.current.draggingIdx) continue;
      cardRefs.current[i].setPos(positions[cards[i].order]);
    }
  }, [dragIdx.current.finalIdx]);

  useEffect(() => {
    window.addEventListener("mousemove", moveCard);
    window.addEventListener("touchmove", moveCard);
    window.addEventListener("mouseup", endDraggingCard);
    window.addEventListener("touchend", endDraggingCard);
    return () => {
      window.removeEventListener("mousemove", moveCard);
      window.removeEventListener("touchmove", moveCard);
      window.removeEventListener("mouseup", endDraggingCard);
      window.removeEventListener("touchend", endDraggingCard);
    };
  }, [moveCard, endDraggingCard]);
  // All drag events is defined.

  // Side effect when transition is over.
  const someCardIsInTrans = isInTrans.some((val) => val);
  useLayoutEffect(() => {
    if (someCardIsInTrans || !eventInfo.current) return;
    // This LayoutEffect occurs only when transition is over.
    removeTransition();
    const start = eventInfo.current?.idx ? eventInfo.current.idx : 0;
    switch (eventInfo.current.event) {
      case "add":
        document.body.style.backgroundColor = "";
        dispatch(addCard({
          idx: start,
          rgb: eventInfo.current.rgb as number[],
        }));
        break;
      case "remove":
        dispatch(delCard(start));
        break;
      case "mouseup":
        dispatch(resetOrder());
        resetPosition();
    }
    eventInfo.current = null;
    setIsEventEnd(true);
  }, [someCardIsInTrans]);
  useEffect(() => {
    if (isEventEnd) {
      setTimeout(() => {
        resetTransition();
        dispatch(setIsPending(false));
      }, 50);
    }
  }, [isEventEnd]);
  return (
    <main className={css.main}>
      {cards.map((card, i) => {
        return <Card key={`card${i}`}
          ref={(el) => cardRefs.current[i] = el as CardHandle}
          cardId={i}
          card={card}
          styleInSettings={borderStyle}
          position={positions[i]}
          handleRemoveCard={() => handleRemoveCard(i)}
          handleTransitionEnd={() => handleTransitionEnd(i)}
          startDraggingCard={(e) => startDraggingCard(e, i)}
        />;
      })}
      <InsertRegions
        positions={positions}
        handleAddCard={handleAddCard}
      />
    </main>
  );
};
export default Palette;
