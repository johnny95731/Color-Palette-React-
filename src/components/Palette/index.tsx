import React, {
  useRef, useMemo, useEffect, useContext, useState, useLayoutEffect,
} from 'react';

import Card from './card.tsx';
import Icon from '../Customs/Icons.tsx';
import css from './index.module.scss';
// Utils
import { equallyLength, evalPosition, round } from 'utils/helpers.ts';
import { blenders } from 'utils/blend.ts';
import { INIT_NUM_OF_CARDS, MAX_NUM_OF_CARDS } from 'utils/constants.ts';
import { getSpaceTrans, randRgbGen, rgb2hex } from 'utils/colors.ts';
// Stores
import {
  useAppDispatch, useAppSelector, selectPlt, selectSettings,
} from '@/features';
import {
  addCard, delCard, moveCardOrder, resetOrder, setIsPending,
} from 'slices/pltSlice.ts';
import MediaContext from '@/features/mediaContext.ts';
// Types
import type { CardExposed } from './card.tsx';

const Palette = () => {
  // States / consts
  const dispatch = useAppDispatch();
  const { cards, numOfCards, colorSpace, blendMode, isPending } = useAppSelector(selectPlt);
  const { border, transition } = useAppSelector(selectSettings);
  const { windowSize, isSmall, pos, clientPos, bound } = useContext(MediaContext);

  const dragIdx = useRef<{
      /**
       * Index of card in `cards` state.
       */
      draggingIdx: number | null;
      /**
       * Final index(order) that cursor at.
       */
      finalIdx: number | null;
  }>({
    draggingIdx: null, finalIdx: null,
  });
  const cardRefs = useRef<CardExposed[]>([]);

  const styleInSettings: React.CSSProperties = useMemo(() => ({
    borderWidth: border.width / 2,
    borderColor: border.show ? border.color : '',
    transitionDuration: (
      `${transition.pos}ms, ${transition.pos}ms, ${transition.color}ms`
    ),
  }), [border, transition]);

  const { cardSize, positions } = useMemo(() => {
    const totalSpace = windowSize[isSmall ? 0 : 1] - bound[0];
    return {
      /**
       * Card width or height (depend on window width).
       */
      cardSize: {
        px: totalSpace / numOfCards,
        percent: equallyLength(numOfCards)
      },
      /**
       * Card left or top (depend on window width).
       */
      positions: Array.from({ length: numOfCards + 1 },
        (_, i) => evalPosition(i, numOfCards),
      ),
    };
  }, [windowSize, numOfCards, border.width]);

  // Set style to all cards.
  const {
    resetPosition, removeTransition, resetTransition,
  } = useMemo(() => {
    return {
      resetPosition() {
        for (let i = 0; i < numOfCards; i++) {
          if (i === dragIdx.current.draggingIdx) continue;
          cardRefs.current[i].setPos(evalPosition(i, numOfCards));
        }
      },
      removeTransition() {
        for (let i = 0; i < numOfCards; i++) {
          cardRefs.current[i].setTransDuration('none');
        }
      },
      resetTransition(end: number = numOfCards) {
        for (let i = 0; i < end; i++) {
          if (i === dragIdx.current.draggingIdx) continue;
          cardRefs.current[i]?.setTransDuration('reset');
        }
      },
    };
  }, [numOfCards]);

  // Add card, remove card, and drag card have transition event.
  // The state is for checking the transition is end.
  const [isInTrans, setIsInTrans] = useState<boolean[]>(() =>
    Array.from({ length: INIT_NUM_OF_CARDS }, () => false),
  );

  const handleTransitionEnd = (cardIdx: number) => {
    setIsInTrans((prev) => {
      const newState = [...prev];
      newState[cardIdx] = false;
      return newState;
    });
  };

  /**
   * Infomation that be used in some events like mouseup(dragging end), add a
   * card, or remove card.
   */
  const [eventInfo, setEventInfo] = useState<{
    event: 'mouseup' | 'add' | 'remove';
    idx?: number;
    rgb?: number[];
  } | null
  >(null);
  const handleAddCard = (idx: number) => {
    // Evaluate new color.
    let rgb;
    if (blendMode === 'random') rgb = randRgbGen();
    else {
      const { inverter } = getSpaceTrans(colorSpace);
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
    if (!transition.pos) { // no transition.
      dispatch(addCard({ idx, rgb }));
      removeTransition();
      setTimeout(() => resetTransition(), 50);
      return;
    }
    document.body.style.backgroundColor = rgb2hex(rgb);
    setEventInfo({ event: 'add', idx, rgb });
    // Transition: shrink and move card. The enpty space is new card
    const newSize = equallyLength(numOfCards + 1);
    for (let i = 0; i < numOfCards; i++) {
      cardRefs.current[i].setSize(newSize);
      const bias = i >= idx ? 1 : 0;
      cardRefs.current[i].setPos(evalPosition(i + bias, numOfCards + 1));
    }
    // Trigger side effect when !isInTrans.some()
    setIsInTrans(Array.from({ length: numOfCards }, () => true));
    dispatch(setIsPending(true));
  };

  // Handle delete card.
  /**
   * Transition before delete card object.
   */
  const handleRemoveCard = (idx: number) => {
    if (!transition.pos) { // no transition.
      dispatch(delCard(idx));
      removeTransition();
      setTimeout(() => resetTransition(numOfCards - 1), 50);
      return;
    }
    // Shrink target card and expand other card.
    const newSize = equallyLength(numOfCards - 1);
    for (let i = 0; i < numOfCards; i++) {
      cardRefs.current[i].setSize(i === idx ? '0%' : newSize);
      const bias = i > idx ? 1 : 0;
      cardRefs.current[i].setPos(evalPosition(i - bias, numOfCards - 1));
    }
    setEventInfo({ event: 'remove', idx });
    setIsInTrans(Array.from({ length: numOfCards - 1 }, () => true));
    dispatch(setIsPending(true));
  };

  // Drag events start
  const { startDraggingCard, moveCard, endDraggingCard } = useMemo(() => {
    const halfCardLength = cardSize.px / 2;
    // Rewrite `cursorPos / cardLength` to `cursorPos * cursorRationCoeff`.
    // Since division cost much time than multiplication.
    const cursorRatio = 1 / cardSize.px;
    const cursorLimited = bound[1] - bound[0];
    let card: CardExposed | null;
    return {
      /**
       * The event is triggered when the `<->` icon on a card is dragging.
       * @param {number} cardIdx The n-th card.
       */
      startDraggingCard(
        e: React.MouseEvent | React.TouchEvent, cardIdx: number,
      ) {
        // Prevent pointer-event.
        if (!e.type.startsWith('touch')) e.preventDefault();
        // Disable pull-to-refresh on mobile.
        document.body.style.overscrollBehavior = 'none';
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
        dragIdx.current.draggingIdx = cardIdx;
        dragIdx.current.finalIdx = cardIdx;
        card = cardRefs.current[cardIdx];
        card.setPos(`${round(cursorPos - halfCardLength)}px`);
        card.setTransDuration('none');
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
        const order = Math.floor(cursorPos * cursorRatio);
        const idx = dragIdx.current.draggingIdx as number;
        const lastOrder = dragIdx.current.finalIdx as number;
        dragIdx.current.finalIdx = order;
        // Change `.order` attribute.
        dispatch(moveCardOrder({ cardIdx: idx, to: order }));
        // Update state: which card start transition.
        if (transition.pos && order !== lastOrder) {
          setIsInTrans((prev) => {
            const newState = [...prev];
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
        document.body.style.overscrollBehavior = '';
        // `draggingIdx` and `finalIdx`setIsEventEnd are set to be non-null
        // together when mouse down.
        const idx = dragIdx.current.draggingIdx;
        const finalOrder = dragIdx.current.finalIdx as number;
        dragIdx.current.draggingIdx = null;
        dragIdx.current.finalIdx = null;
        if (idx === null) return;
        // Remove class.
        card_.element.classList.remove(css.dragging);
        setEventInfo({ event: 'mouseup' });
        if (!transition.pos) {
          removeTransition();
          dispatch(resetOrder());
          resetPosition();
          return;
        }
        // Dragging card move to target position.
        card_.setPos(evalPosition(finalOrder, numOfCards));
        card_.setTransDuration('reset');
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
    window.addEventListener('mousemove', moveCard);
    window.addEventListener('touchmove', moveCard);
    window.addEventListener('mouseup', endDraggingCard);
    window.addEventListener('touchend', endDraggingCard);
    return () => {
      window.removeEventListener('mousemove', moveCard);
      window.removeEventListener('touchmove', moveCard);
      window.removeEventListener('mouseup', endDraggingCard);
      window.removeEventListener('touchend', endDraggingCard);
    };
  }, [moveCard]); // Both functions in the same useMemo
  // All drag events is defined.

  // Side effect when transition is over.
  const someCardIsInTrans = isInTrans.some((val) => val);
  useLayoutEffect(() => {
    if (someCardIsInTrans || !eventInfo) return;
    // This LayoutEffect occurs only when transition is over.
    removeTransition();
    const start = eventInfo?.idx ? eventInfo.idx : 0;
    switch (eventInfo.event) {
    case 'add':
      document.body.style.backgroundColor = '';
      dispatch(addCard({
        idx: start,
        rgb: eventInfo.rgb as number[],
      }));
      break;
    case 'remove':
      dispatch(delCard(start));
      break;
    case 'mouseup':
      dispatch(resetOrder());
      resetPosition();
      break;
    }
    setEventInfo(null);
  }, [someCardIsInTrans]);
  useEffect(() => {
    if (!eventInfo) {
      setTimeout(() => {
        resetTransition();
        dispatch(setIsPending(false));
      }, 50);
    }
  }, [eventInfo]);

  const displayStyle = (
    (numOfCards === MAX_NUM_OF_CARDS || isPending) ?
      { display: 'none' } :
      undefined
  );
  return (
    <main id="main">
      {cards.map((card, i) => {
        return <Card key={`card${i}`}
          ref={(el) => cardRefs.current[i] = el as CardExposed}
          cardIdx={i}
          card={card}
          styleInSettings={styleInSettings}
          length={cardSize.percent}
          position={positions[i]}
          handleRemoveCard={() => handleRemoveCard(i)}
          handleTransitionEnd={() => handleTransitionEnd(i)}
          startDraggingCard={(e) => startDraggingCard(e, i)}
        />;
      })}
      <span style={displayStyle} >
        {Array.from({ length: numOfCards + 1 }, (_, i) => {
          return (
            <div key={`insert${i}`}
              className={css.insertWrapper}
              style={{ [pos]: positions[i] }}
            >
              <div onClick={() => handleAddCard(i)} >
                <Icon type={'insert'} />
              </div>
            </div>
          );
        })}
      </span>
    </main>
  );
};
export default Palette;
