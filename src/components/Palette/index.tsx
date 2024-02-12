import React, {
  useRef, useCallback, useMemo, useEffect, useContext, useState,
  useLayoutEffect,
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
  addCard, delCard, moveCard, resetOrder, setIsPending,
} from "@/features/slices/pltSlice.ts";
import MediaContext from "@/features/mediaContext.ts";
// Types
import type {CardHandle} from "./card.tsx";

// Other components
const InsertRegions = ({
  addCardTransition,
  isExcutingTrans,
}: {
  addCardTransition: (idx: number) => void;
  isExcutingTrans: boolean;
}) => {
  // States / consts
  const {numOfCards} = useAppSelector(selectPlt);
  const {isSmall, pos} = useContext(MediaContext);

  const positions = useMemo(() => {
    return Array.from({length: numOfCards + 1}, (_, i) => {
      const style: {[key: string]: string} = {};
      style[pos] = evalPosition(i, numOfCards);
      return style;
    });
  }, [numOfCards, isSmall]);

  const displayStyle = (
    (numOfCards === MAX_NUM_OF_CARDS || isExcutingTrans) ?
        {display: "none"} :
        undefined
  );

  const handleAddCard = addCardTransition;
  return (
    <div id="insertRegion"
      style={displayStyle}
    >
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


const Palette = () => {
  // States / consts
  const dispatch = useAppDispatch();
  const {
    cards, numOfCards, colorSpace, blendMode, isPending,
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
  };

  const {cardLength, cardsPos} = useMemo(() => {
    const cardLength = (
      ((isSmall ? windowSize[0] : windowSize[1]) - bound[0]) / numOfCards
    );
    return {
      cardLength,
      cardsPos: Array.from({length: numOfCards},
          (_, i) => evalPosition(i, numOfCards),
      ),
    };
  }, [...windowSize, numOfCards]);

  const {
    resetPosition, removeTransitionDuration, resetTransitionDuration,
  } = useMemo(() => {
    return {
      resetPosition() {
        for (let i = 0; i < numOfCards; i++) {
          if (i === dragIdx.current.draggingIdx) continue;
          cardRefs.current[i].setPos(cardsPos[i]);
        }
      },
      removeTransitionDuration() {
        for (let i = 0; i < numOfCards; i++) {
          cardRefs.current[i].setTransDuration("none");
        }
      },
      resetTransitionDuration() {
        for (let i = 0; i < numOfCards; i++) {
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
  const addCardObj = useRef<{idx: number; rgb: number[];} | null>(null);
  const addCardTransition = (idx: number) => {
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
    // Transition: shrink and move card and enpty space is new card
    const length = evalLength(numOfCards + 1);
    if (!transition.pos) { // no transition.
      dispatch(addCard({idx, rgb}));
      removeTransitionDuration();
      for (let i = 0; i < numOfCards; i++) {
        cardRefs.current[i].setSize(length);
        cardRefs.current[i].setPos(
            evalPosition(cards[i].order, numOfCards + 1),
        );
      }
      setTimeout(() => resetTransitionDuration(), 50);
      return;
    }
    for (let i = 0; i < numOfCards; i++) {
      cardRefs.current[i].setSize(length);
      const bias = i >= idx ? 1 : 0;
      cardRefs.current[i].setPos(
          evalPosition(cards[i].order + bias, numOfCards + 1),
      );
    }
    resetTransitionDuration();
    document.body.style.backgroundColor = rgb2hex(rgb);
    // Trigger side effect when !isExcutingTrans.some()
    setIsInTrans(Array.from({length: numOfCards}, () => true));
    addCardObj.current = {idx, rgb};
  };

  // Handle delete card.
  const [removeTransStep, setRemoveTransStep] = useState(() => 0);
  const removeCardIdx = useRef<number | null>(null);
  /**
   * Transition before delete card object.
   * @param idx
   */
  const removeCardTransition = (idx: number) => {
    if (!transition.pos) { // no transition.
      dispatch(delCard(idx));
      removeTransitionDuration();
      const newLength = evalLength(numOfCards - 1);
      for (let i = 0; i < numOfCards - 1; i++) {
        cardRefs.current[i].setPos(evalPosition(i, numOfCards - 1));
        cardRefs.current[i].setSize(newLength);
      }
      setTimeout(() => {
        for (let i = 0; i < numOfCards - 1; i++) {
          cardRefs.current[i].setTransDuration("reset");
        }
      }, 50);
      return;
    }
    resetTransitionDuration();
    dispatch(setIsPending(true));
    const newLength = evalLength(numOfCards - 1);
    const targetOrder = cards[idx].order;
    setIsInTrans(Array.from({length: numOfCards - 1}, () => true));
    // Shrink target card and expand other card.
    for (let i = 0; i < numOfCards; i++) {
      if (i === idx) {
        cardRefs.current[i].setSize("0%");
        cardRefs.current[i].setPos(
            evalPosition(cards[i].order, numOfCards - 1),
        );
        continue;
      }
      const bias = cards[i].order > targetOrder ? 1 : 0;
      cardRefs.current[i].setSize(newLength);
      cardRefs.current[i].setPos(
          evalPosition(cards[i].order - bias, numOfCards - 1),
      );
    }
    removeCardIdx.current = idx;
    setIsEventEnd(false);
  };

  // Drag events start
  /**
   * The event is triggered when the `<->` icon on a card is dragging.
   * @param {number} cardId The n-th card.
   */
  const handleDraggingCard = useCallback((
      e: React.MouseEvent | React.TouchEvent, cardIdx: number,
  ) => {
    // Prevent pointer-event.
    e.preventDefault();
    // Disable pull-to-refresh on mobile.
    document.body.style.overscrollBehavior = "none";
    // Cursor position when mouse down.
    const cursorPos = (
      (e as React.MouseEvent)[clientPos] ||
      (e as React.TouchEvent).touches[0][clientPos]
    ) - bound[0];
    dispatch(setIsPending(true));
    if (transition.pos) {
      setIsInTrans((prev) => {
        const newState = [...prev];
        newState[cardIdx] = true;
        return newState;
      });
    }
    setIsEventEnd(false);
    dragIdx.current.draggingIdx = cardIdx;
    dragIdx.current.finalIdx = cardIdx;
    resetTransitionDuration();
    const card = cardRefs.current[cardIdx];
    card.setPos(`${round(cursorPos - cardLength / 2)}px`);
    card.setTransDuration("none");
    card.element.classList.add(css.dragging);
  }, [cardLength, isSmall, bound[0], cards, transition.pos]);

  /**
   * The event is triggered when the `<->` icon on a card is dragging and mouse
   * is moving.
   */
  const handleMouseMove = useCallback((e: MouseEvent | TouchEvent) => {
    const idx = dragIdx.current.draggingIdx;
    if (idx === null) return;
    const cursorPos = (
      (e as MouseEvent)[clientPos] ||
      (e as TouchEvent).touches[0][clientPos]
    ) - bound[0];
    // Mouse is not in range.
    if (cursorPos < 0 || cursorPos > bound[1] - bound[0]) return;
    const card = cardRefs.current[idx];
    card.setPos(`${round(cursorPos - cardLength / 2)}px`);
    // Order of card that cursor at.
    const order = Math.floor(cursorPos / cardLength);
    const lastOrder = dragIdx.current.finalIdx as number;
    dragIdx.current.finalIdx = order;

    // Change `.order` attribute.
    dispatch(moveCard({init: idx, final: order}));
    // Update state: which card start transition.
    if (transition.pos) {
      setIsInTrans((prev) => {
        if (order === lastOrder) return prev;
        const newState = [...prev];
        // No exchange happened
        const moveToRightSide = lastOrder < order;
        if ( // Be away from origin place.
          (idx > order && !moveToRightSide) ||
          (idx < order && moveToRightSide)
        ) {
          newState[order] = true;
        } else { // Close to origin place.
          newState[lastOrder] = true;
        }
        return newState;
      });
    }
  }, [cardLength, isSmall, ...bound, transition.pos]);

  useEffect(() => { // When cursor move into another card.
    if (dragIdx.current.finalIdx === null) return;
    for (let i = 0; i < numOfCards; i++) {
      if (i === dragIdx.current.draggingIdx) continue;
      cardRefs.current[i].setPos(cardsPos[cards[i].order]);
    }
  }, [dragIdx.current.finalIdx]);

  const [mouseUpEffect, setMouseUpEffect] = useState<boolean>(false);
  /**
   * The event is triggered when release left buton.
   */
  const handleMouseUp = useCallback(() => {
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
    const card = cardRefs.current[idx];
    card.element.classList.remove(css.dragging);
    // Dragging card move to target position.
    card.setPos(evalPosition(finalOrder, numOfCards));
    card.setTransDuration("pos");
    setMouseUpEffect(true);
    if (!transition.pos) {
      removeTransitionDuration();
      dispatch(resetOrder());
      resetPosition();
      setIsEventEnd(true);
      dispatch(setIsPending(false));
    }
  }, [numOfCards, transition.pos]);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("touchmove", handleMouseMove);
    window.addEventListener("touchend", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleMouseMove);
      window.removeEventListener("touchend", handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);
  // Drag events end

  // Side effect when transition is over.
  useEffect(() => {
    if (removeTransStep === 1) {
      setIsEventEnd(true);
      setRemoveTransStep(0);
    }
  }, [removeTransStep]);
  useEffect(() => {
    if (!isPending) {
      resetTransitionDuration();
      dispatch(setIsPending(false));
    }
  }, [isEventEnd]);
  const someCardIsInTrans = isInTrans.some((val) => val);
  useLayoutEffect(() => {
    if (someCardIsInTrans) return;
    if (addCardObj.current !== null) { // After adding card.
      dispatch(addCard(addCardObj.current));
      document.body.style.backgroundColor = "";
      for (let i = 0; i < numOfCards; i++) {
        cardRefs.current[i].setPos(evalPosition(i, numOfCards + 1));
      }
      removeTransitionDuration();
      addCardObj.current = null;
      setIsEventEnd(true);
    } else if (removeCardIdx.current !== null) { // After remove card.
      // Call "delCard" action. Card of Index `numOfCards - 1` will be delete.
      // Have to set the style to new position.
      const idx = removeCardIdx.current;
      for (let i = idx; i < numOfCards; i++) {
        cardRefs.current[i].setPos(evalPosition(i, numOfCards - 1));
        cardRefs.current[i].setTransDuration("none");
      }
      // Only index `cardIdx` is not newLength since `removeCardTransition`.
      const newLength = evalLength(numOfCards - 1);
      cardRefs.current[idx].setSize(newLength);
      dispatch(delCard(idx));
      removeCardIdx.current = null;
      setRemoveTransStep(1);
    } else if (mouseUpEffect) { // After mouse up event.
      removeTransitionDuration();
      dispatch(resetOrder());
      resetPosition();
      dispatch(setIsPending(false));
      setIsEventEnd(true);
      setMouseUpEffect(false);
    }
  }, [someCardIsInTrans, mouseUpEffect]);
  return (
    <main className={css.main}>
      {cards.map((card, i) => {
        return <Card key={`card${i}`}
          ref={(el) => cardRefs.current[i] = el as CardHandle}
          cardId={i}
          card={card}
          borderStyle={borderStyle}
          position={cardsPos[i]}
          isExcutingTrans={!isEventEnd}
          removeCardTransition={() => removeCardTransition(i)}
          handleTransitionEnd={() => handleTransitionEnd(i)}
          handleDraggingCard={(e) => handleDraggingCard(e, i)}
        />;
      })}
      <InsertRegions
        addCardTransition={addCardTransition}
        isExcutingTrans={!isEventEnd}
      />
    </main>
  );
};
export default Palette;
