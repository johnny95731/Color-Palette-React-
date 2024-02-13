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
  addCardTransition,
}: {
  addCardTransition: (idx: number) => void;
}) => {
  // States / consts
  const {numOfCards, isPending} = useAppSelector(selectPlt);
  const {isSmall, pos} = useContext(MediaContext);

  const positions = useMemo(() => {
    return Array.from({length: numOfCards + 1}, (_, i) => {
      const style: {[key: string]: string} = {};
      style[pos] = evalPosition(i, numOfCards);
      return style;
    });
  }, [numOfCards, isSmall]);

  const displayStyle = (
    (numOfCards === MAX_NUM_OF_CARDS || isPending) ?
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

  // Set style to all cards.
  const {
    resetPosition, removeTransition, resetTransition,
  } = useMemo(() => {
    return {
      resetPosition() {
        for (let i = 0; i < numOfCards; i++) {
          if (i === dragIdx.current.draggingIdx) continue;
          cardRefs.current[i].setPos(cardsPos[i]);
        }
      },
      removeTransition() {
        for (let i = 0; i < numOfCards; i++) {
          cardRefs.current[i].setTransDuration("none");
        }
      },
      resetTransition() {
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

  const [transEndEffect, setTransEndEffect] = useState(() => false);
  // Transition before adding card.
  const addCardObj = useRef<{idx: number; rgb: number[];} | null>(null);
  const TransAddCard = (idx: number) => {
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
      removeTransition();
      for (let i = 0; i < numOfCards; i++) {
        cardRefs.current[i].setSize(length);
        cardRefs.current[i].setPos(
            evalPosition(cards[i].order, numOfCards + 1),
        );
      }
      setTimeout(() => resetTransition(), 50);
      return;
    }
    for (let i = 0; i < numOfCards; i++) {
      cardRefs.current[i].setSize(length);
      const bias = i >= idx ? 1 : 0;
      cardRefs.current[i].setPos(
          evalPosition(cards[i].order + bias, numOfCards + 1),
      );
    }
    dispatch(setIsPending(true));
    setIsEventEnd(false);
    document.body.style.backgroundColor = rgb2hex(rgb);
    // Trigger side effect when !isExcutingTrans.some()
    setIsInTrans(Array.from({length: numOfCards}, () => true));
    addCardObj.current = {idx, rgb};
  };

  // Handle delete card.
  const removeCardIdx = useRef<number | null>(null);
  /**
   * Transition before delete card object.
   * @param idx
   */
  const transRemoveCard = (idx: number) => {
    if (!transition.pos) { // no transition.
      dispatch(delCard(idx));
      removeTransition();
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
  const [mouseUpEffect, setMouseUpEffect] = useState<boolean>(false);
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
        e.preventDefault();
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
        resetTransition();
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
        // Dragging card move to target position.
        card_.setPos(evalPosition(finalOrder, numOfCards));
        card_.setTransDuration("pos");
        setMouseUpEffect(true);
        if (!transition.pos) {
          removeTransition();
          dispatch(resetOrder());
          resetPosition();
          dispatch(setIsPending(false));
          setIsEventEnd(true);
        }
      },
    };
  }, [numOfCards, isSmall, bound, transition.pos]);
  useEffect(() => { // When cursor move into another card.
    if (dragIdx.current.finalIdx === null) return;
    for (let i = 0; i < numOfCards; i++) {
      if (i === dragIdx.current.draggingIdx) continue;
      cardRefs.current[i].setPos(cardsPos[cards[i].order]);
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
  // Drag events end

  // Side effect when transition is over.
  useEffect(() => {
    if (!transEndEffect) return;
    if (removeCardIdx.current !== null) {
      const idx = removeCardIdx.current;
      removeCardIdx.current = null;
      dispatch(delCard(idx));
    }
    setIsEventEnd(true);
    setTransEndEffect(false);
  }, [transEndEffect]);
  useEffect(() => {
    if (isEventEnd) {
      resetTransition();
      dispatch(setIsPending(false));
    }
  }, [isEventEnd]);
  const someCardIsInTrans = isInTrans.some((val) => val);
  useLayoutEffect(() => {
    if (someCardIsInTrans) return;
    // This LayoutEffect occurs only when transition is over.
    removeTransition();
    if (addCardObj.current !== null) { // After transition about adding card.
      dispatch(addCard(addCardObj.current));
      addCardObj.current = null;
      document.body.style.backgroundColor = "";
      for (let i = 0; i < numOfCards; i++) {
        cardRefs.current[i].setPos(evalPosition(i, numOfCards + 1));
      }
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
      setTransEndEffect(true);
    } else if (mouseUpEffect) { // After mouse up event.
      resetPosition();
      dispatch(resetOrder());
      setTransEndEffect(true);
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
          transRemoveCard={() => transRemoveCard(i)}
          handleTransitionEnd={() => handleTransitionEnd(i)}
          startDraggingCard={(e) => startDraggingCard(e, i)}
        />;
      })}
      <InsertRegions
        addCardTransition={TransAddCard}
      />
    </main>
  );
};
export default Palette;
