import React, {
  useRef, useCallback, useMemo, useEffect, useContext, useState,
} from "react";

import Card from "./card.tsx";
import Icon from "../Customs/Icons.tsx";
import css from "./index.scss";
import {toPercent} from "@/common/utils/helpers.ts";
import {blenders} from "@/common/utils/blend.ts";
import {INIT_NUM_OF_CARDS, MAX_NUM_OF_CARDS} from "@/common/utils/constants.ts";
import {getSpaceTrans, randRgbGen, rgb2hex} from "@/common/utils/colors.ts";
// Stores
import {
  useAppDispatch, useAppSelector, selectPlt,
  selectSettings,
} from "@/features";
import {
  addCard, delCard, moveCard, resetOrder, setIsReordering,
} from "@/features/slices/pltSlice.ts";
import MediaContext from "@/features/mediaContext.ts";
// Types
import type {MouseHandler} from "types/eventHandler.ts";
import type {CardType} from "@/features/types/pltType.ts";

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
    const step = 1 / numOfCards;
    return Array.from({length: numOfCards + 1}, (_, i) => {
      const style: {[key: string]: string} = {};
      style[pos] = `${toPercent(i * step, 2)}%`;
      return style;
    });
  }, [numOfCards, isSmall]);

  const displayStyle = (
    (numOfCards === MAX_NUM_OF_CARDS || isExcutingTrans) ?
        {display: "none"} :
        undefined
  );

  // Events
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
  const {cards, numOfCards, colorSpace, blendMode} = useAppSelector(selectPlt);
  const {border, transition} = useAppSelector(selectSettings);
  const {windowSize, isSmall, pos, clientPos, bound} = useContext(MediaContext);
  const prevCardNum = useRef(numOfCards);

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
  const cardRefs = useRef<HTMLDivElement[]>([]);

  const cardStyle = {
    [isSmall ? "height" : "width"]: `${toPercent(1 / numOfCards, 2)}%`,
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
          (_, i) => `${toPercent(i / numOfCards, 2)}%`,
      ),
    };
  }, [...windowSize, numOfCards]);

  const {resetPosition, removeTransitionDuration} = useMemo(() => {
    return {
      resetPosition() {
        for (let i = 0; i < numOfCards; i++) {
          if (i === dragIdx.current.draggingIdx) continue;
          cardRefs.current[i].style[pos] = `${toPercent(i / numOfCards, 2)}%`;
        }
      },
      removeTransitionDuration() {
        for (let i = 0; i < numOfCards; i++) {
          cardRefs.current[i].style.transitionDuration = "";
        }
      },
    };
  }, [isSmall, numOfCards]);

  const resetTransitionDuration = () => {
    for (let i = 0; i < numOfCards; i++) {
      cardRefs.current[i].style.transitionDuration = (
        `${transition.pos}ms, ${transition.pos}ms, ${transition.color}ms`
      );
    }
  };
  useEffect(() => resetTransitionDuration(), []); // Init transition duration.

  // Add card, remove card, and drag card have transition event.
  // The state is for checking the transition is end.
  const [isExcutingTrans, setIsExcutingTrans] = useState<boolean[]>(() =>
    Array.from({length: INIT_NUM_OF_CARDS}, () => false),
  );
  // After transition end, some side effect will happen. This state is present
  // for checking the entire event and side effect is complete.
  const [isEventEnd, setIsEventEnd] = useState(true);

  const handleTransitionEnd = (cardIdx: number) => {
    setIsExcutingTrans((prev) => {
      const newState = [...prev];
      newState[cardIdx] = false;
      return newState;
    });
  };

  // Transition after adding card.
  const [addCardTrans, setAddCardStep] = useState<number>(() => 0);
  const addCardObj = useRef<{idx: number; rgb: number[];} | null>(null);
  const addCardTransition = (idx: number) => {
    let rgb;
    if (blendMode === "random") rgb = randRgbGen();
    else {
      const {inverter} = getSpaceTrans(colorSpace);
      // Pick cards.
      let leftRgbColor;
      let rightRgbColor;
      // -Add to the first. Blending the first card and black.
      if (!idx) leftRgbColor = [0, 0, 0];
      else {
        leftRgbColor = inverter(
            (cards.find((card) => card.order === idx - 1) as CardType).color,
        );
      }
      // -Add to the last. Blending the last card and white.
      if (idx === numOfCards) rightRgbColor = [255, 255, 255];
      else {
        rightRgbColor = inverter(
            (cards.find((card) => card.order === idx) as CardType).color,
        );
      }
      // Blend
      rgb = blenders[blendMode](
          leftRgbColor, rightRgbColor, colorSpace,
      );
    }
    document.body.style.backgroundColor = rgb2hex(rgb);
    const size = isSmall ? "height" : "width";
    const length = `${toPercent(1 / (numOfCards + 1), 2)}%`;
    for (let i = 0; i < numOfCards; i++) {
      cardRefs.current[i].style[size] = length;
      const bias = i >= idx ? 1 : 0;
      cardRefs.current[i].style[pos] = (
        `${toPercent((cards[i].order + bias) / (numOfCards + 1), 2)}%`
      );
    }
    setIsExcutingTrans(Array.from({length: numOfCards}, () => true));
    addCardObj.current = {idx, rgb};
    setIsEventEnd(false);
  };

  useEffect(() => {
    if (addCardTrans === 1) { // Reset oder of cards.
      removeTransitionDuration();
      resetPosition();
      setAddCardStep(2);
    } else if (addCardTrans === 2) {
      resetTransitionDuration();
      addCardObj.current = null;
      setIsEventEnd(true);
      setAddCardStep(0);
    }
  }, [addCardTrans]);

  // Handle delete card.
  const [removeCardStep, setRemoveCardStep] = useState<number>(() => 0);
  const removeCardIdx = useRef<number | null>(null);
  /**
   * Transition before delete card object.
   * @param cardIdx
   */
  const removeCardTransition = (cardIdx: number) => {
    const size = isSmall ? "height" : "width";
    const newLength = `${toPercent(1 / (numOfCards - 1), 2)}%`;
    const targetOrder = cards[cardIdx].order;
    // Shrink target card and expand other card.
    for (let i = 0; i < numOfCards; i++) {
      if (i === cardIdx) {
        cardRefs.current[i].style[size] = "0%";
        cardRefs.current[i].style[pos] = (
          `${toPercent((cards[i].order) / (numOfCards - 1), 2)}%`
        );
        continue;
      }
      const bias = cards[i].order > targetOrder ? 1 : 0;
      cardRefs.current[i].style[size] = newLength;
      cardRefs.current[i].style[pos] = (
        `${toPercent((cards[i].order - bias) / (numOfCards - 1), 2)}%`
      );
    }
    setIsExcutingTrans(Array.from({length: numOfCards - 1}, () => true));
    removeCardIdx.current = cardIdx;
    setIsEventEnd(false);
  };
  useEffect(() => {
    if (removeCardStep === 1) {
      resetPosition();
      setRemoveCardStep(2);
    } else if (removeCardStep === 2) {
      resetTransitionDuration();
      setIsEventEnd(true);
      setRemoveCardStep(0);
    }
  }, [removeCardStep]);

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
    const nowPos = (
      (e as React.MouseEvent)[clientPos] ||
      (e as React.TouchEvent).touches[0][clientPos]
    ) - bound[0];
    dispatch(setIsReordering(true));
    setIsExcutingTrans((prev) => {
      const newState = [...prev];
      newState[cardIdx] = true;
      return newState;
    });
    setIsEventEnd(false);
    dragIdx.current.draggingIdx = cardIdx;
    dragIdx.current.finalIdx = cardIdx;
    const card = cardRefs.current[cardIdx];
    card.style[pos] = `${nowPos - cardLength / 2}px`;
    card.style.transitionDuration = "";
    card.classList.add(css.dragging);
  }, [numOfCards, isSmall, bound[0], cards]);

  /**
   * The event is triggered when the `<->` icon on a card is dragging and mouse
   * is moving.
   */
  const handleMouseMove = useCallback((e: MouseEvent | TouchEvent) => {
    const idx = dragIdx.current.draggingIdx;
    if (idx === null) return;
    const nowPos = (
      (e as MouseEvent)[clientPos] ||
      (e as TouchEvent).touches[0][clientPos]
    ) - bound[0];
    // Mouse is not in range.
    if (nowPos < 0 || nowPos > bound[1] - bound[0]) return;
    const card = cardRefs.current[idx];
    card.style[pos] = `${nowPos - cardLength / 2}px`;
    // Order of card that cursor at.
    const order = Math.floor(nowPos / cardLength);
    const lastOrder = dragIdx.current.finalIdx as number;
    dragIdx.current.finalIdx = order;

    // Change .order attribute.
    dispatch(moveCard({init: idx, final: order}));
    // Update state: start transition.
    setIsExcutingTrans((prev) => {
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
  }, [cardLength, isSmall, ...bound]); // pos depends on `isSmall`.

  useEffect(() => { // When cursor move into another card or mouse up.\
    for (let i = 0; i < numOfCards; i++) {
      if (i === dragIdx.current.draggingIdx) continue;
      cardRefs.current[i].style[pos] = cardsPos[cards[i].order];
    }
  }, [dragIdx.current.finalIdx]);

  const [mouseUpStep, setMouseUpStep] = useState<number>(0);
  /**
   * The event is triggered when release left buton.
   */
  const handleMouseUp = useCallback(() => {
    // Able pull-to-refresh on mobile.
    document.body.style.overscrollBehavior = "";
    const idx = dragIdx.current.draggingIdx;
    if (idx === null) return;
    // `nowDragging` and `finalOrder` are set to be non-null together when
    // mouse down.
    const finalOrder = dragIdx.current.finalIdx as number;
    // Update state.
    dragIdx.current.draggingIdx = null;
    dragIdx.current.finalIdx = null;
    // Remove class.
    const card = cardRefs.current[idx];
    card.classList.remove(css.dragging);
    // Dragging card move to target position.
    card.style[pos] = `${toPercent(finalOrder / numOfCards, 2)}%`;
    card.style.transitionDuration = `${transition.pos}ms, 0ms`;
    setMouseUpStep(1);
  }, [isSmall, numOfCards, transition.pos]);
  // Side-effect when mouse-up transition is over..
  useEffect(() => {
    if (mouseUpStep < 2) return;
    if (mouseUpStep === 2) {
      dispatch(setIsReordering(false));
      resetTransitionDuration();
      setIsExcutingTrans((prev) => Array.from(prev, () => false));
      setIsEventEnd(true);
      setMouseUpStep(0);
    }
  }, [mouseUpStep]);

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

  // Side effect when transition end.
  const someCardIsExcutingTrans = isExcutingTrans.some((val) => val);
  useEffect(() => {
    if (someCardIsExcutingTrans) return;
    if (addCardObj.current !== null) { // After adding card.
      dispatch(addCard(addCardObj.current));
      removeTransitionDuration();
      for (let i = 0; i < numOfCards; i++) {
        cardRefs.current[i].style[pos] = (
          `${toPercent(i / (numOfCards + 1), 2)}%`
        );
      }
      document.body.style.backgroundColor = "";
      setTimeout(() => setAddCardStep(1), 50);
    } else if (removeCardIdx.current !== null) { // After remove card.
      // Step 2. Call delete card action. Index `numOfCards - 1` of card DOM
      // will be delete. Have to set the style to new position.
      const cardIdx = removeCardIdx.current;
      dispatch(delCard(cardIdx));
      removeTransitionDuration();
      for (let i = 0; i < numOfCards - 1; i++) {
        if (i < cardIdx) continue;
        cardRefs.current[i].style[pos] = (
          `${toPercent(i / (numOfCards - 1), 2)}%`
        );
      }
      // Only index `cardIdx` is not newLength since `removeCardTransition`.
      const size = isSmall ? "height" : "width";
      const newLength = `${toPercent(1 / (numOfCards - 1), 2)}%`;
      cardRefs.current[cardIdx].style[size] = newLength;
      prevCardNum.current = numOfCards - 1;
      removeCardIdx.current = null;
      setTimeout(() => setRemoveCardStep(1), 50);
    } else if (mouseUpStep === 1) { // After mouse up event.
      // Prevent transition when state is updated.
      removeTransitionDuration();
      dispatch(resetOrder());
      resetPosition();
      setTimeout(() => setMouseUpStep(2), 50);
    }
  }, [someCardIsExcutingTrans]);
  return (
    <main className={css.main}>
      {cards.map((card, i) => {
        return <Card key={`card${i}`}
          ref={(el) => cardRefs.current[i] = (el as HTMLDivElement)}
          cardId={i}
          numOfCards={numOfCards}
          card={card}
          cardStyle={cardStyle}
          position={cardsPos[i]}
          isExcutingTrans={someCardIsExcutingTrans || !isEventEnd}
          removeCardTransition={() => removeCardTransition(i)}
          handleTransitionEnd={() => handleTransitionEnd(i)}
          handleDraggingCard={
            ((e: React.MouseEvent<HTMLDivElement>) =>
              handleDraggingCard(e, i)) as MouseHandler
          }
        />;
      })}
      <InsertRegions
        addCardTransition={addCardTransition}
        isExcutingTrans={someCardIsExcutingTrans || !isEventEnd}
      />
    </main>
  );
};
export default Palette;
