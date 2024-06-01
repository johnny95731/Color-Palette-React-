import React, {
  useMemo, useEffect, useCallback, forwardRef, useRef, useContext, useState,
  useLayoutEffect, useImperativeHandle,
  Fragment,
} from 'react';
import css from './card.module.scss';
import Icon from '../Customs/Icons.tsx';
import Slider from '../Customs/Slider.tsx';
// utils
import {
  rgb2gray, rgb2hex, hex2rgb, isValidHex, getSpaceInfos, getSpaceTrans,
  gradientGen,
} from '@/common/utils/colors.ts';
import {
  getClosestName, hexTextEdited, copyHex, evalLength, evalPosition,
} from '@/common/utils/helpers.ts';
// Stores
import {
  useAppDispatch, useAppSelector, selectPlt, selectFavorites, selectSettings,
} from '@/features';
import {
  refreshCard, editCard, setIsLock, setIsEditing,
} from '@/features/slices/pltSlice.ts';
import { favColorsChanged } from 'slices/favSlice.ts';
import MediaContext from '@/features/mediaContext.ts';
// types
import type { MouseHandler, TouchHandler } from 'types/eventHandler.ts';
import type { CardType, ColorSpacesType } from 'types/pltType.ts';


// Other Components
const ToolBar = ({
  cardIdx,
  numOfCards,
  card,
  filterStyle,
  startDraggingCard,
  removeCard,
}: {
  cardIdx: number;
  numOfCards: number;
  card: CardType;
  filterStyle: {filter: string} | undefined;
  startDraggingCard: MouseHandler | TouchHandler;
  removeCard: () => void;
}) => {
  // States / consts
  const { colors: favColors, isInit } = useAppSelector(selectFavorites);
  const isFav = useMemo(() => {
    return favColors.includes(card.hex);
  }, [card.hex, favColors.length, isInit[0]]);
  const dispatch = useAppDispatch();

  const { opacity, cursor } = useMemo(() => {
    return numOfCards === 2 ?
      {
        opacity: '0',
        cursor: 'default',
      } :
      {
        opacity: '',
        cursor: 'pointer',
      };
  }, [numOfCards]);

  const events = useMemo(() => {
    return {
      refreshCard: () => {
        dispatch(refreshCard(cardIdx));
      },
      isLockChanged: () => {
        dispatch(setIsLock(cardIdx));
      },
      isEditingChanged: () => {
        dispatch(setIsEditing(cardIdx));
      },
    };
  }, [cardIdx]);

  const ifFavIcon = isFav ? 'fav' : 'unfav';
  const handleFavClick = () => {
    dispatch(favColorsChanged(card.hex));
  };

  return (
    <div className={css.toolContainer}>
      <Icon type="close"
        style={{
          ...filterStyle,
          opacity,
          cursor,
        }}
        onClick={removeCard}
      />
      <Icon type={card.isLock ? 'lock' : 'unlock'}
        style={filterStyle}
        onClick={events.isLockChanged}
      />
      <Icon type={ifFavIcon}
        style={filterStyle}
        onClick={handleFavClick}
      />
      <Icon type="move"
        style={{
          ...filterStyle,
          cursor: 'grab',
        }}
        onMouseDown={startDraggingCard as MouseHandler}
        onTouchStart={startDraggingCard as TouchHandler}
      />
      <Icon type="refresh"
        style={filterStyle}
        onClick={events.refreshCard}
      />
      <Icon type="edit"
        style={filterStyle}
        onClick={events.isEditingChanged}
      />
    </div>
  );
};

const EditingDialog = forwardRef<HTMLDivElement, any>(({
  cardIdx,
  card,
  colorSpace,
  roundedColor,
}: {
  cardIdx: number;
  card: CardType;
  colorSpace: ColorSpacesType
  roundedColor: number[];
}, ref,
) => {
  const dispatch = useAppDispatch();
  const { color, isEditing } = card;

  const hexInputRef = useRef<HTMLInputElement>(null);

  const { labels, maxes, converter, inverter } = useMemo(() => {
    return {
      ...getSpaceInfos(colorSpace),
      ...getSpaceTrans(colorSpace),
    };
  }, [colorSpace]);

  /**
   * Finish Hex editing when input is blurred or press "Enter"
   */
  const handleHexEditingFinished = useCallback((
      e: React.FocusEvent<HTMLInputElement>
         | React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.type === 'keydown' && (e as React.KeyboardEvent).key !== 'Enter') {
      return;
    }
    const textInput = e.currentTarget;
    const text = textInput.value;
    if (isValidHex(text)) {
      const rgb = hex2rgb(text);
      if (!rgb) return;
      const newColor = converter(rgb);
      dispatch(editCard({ idx: cardIdx, color: newColor }));
      let slider: HTMLInputElement | null;
      for (let i = 0; i < 4; i++) {
        slider = (
          document.getElementById(`card${cardIdx}-slider${i}`) as
          HTMLInputElement | null
        );
        if (slider) slider.value = String(newColor[i]);
      }
      if (text.length === 4) {
        const hex6 = `#${text[1]+text[1]}${text[2]+text[2]}${text[3]+text[3]}`;
        textInput.value = hex6;
      }
    }
  }, [colorSpace]);

  /**
   * Slider changed event.
   */
  const handleSliderChange = (newVal: number, colorAxis: number) => {
    const newColor = [...color];
    newColor[colorAxis] = newVal;
    dispatch(editCard({ idx: cardIdx, color: newColor }));
    // Set hex to hex input.
    const textInput = hexInputRef.current as HTMLInputElement;
    const rgb = inverter(newColor);
    textInput.value = rgb2hex(rgb);
  };

  const handleDialogBlurred = (e: React.FocusEvent<HTMLInputElement>) => {
    if (isEditing && e.relatedTarget === null) {
      handleHexEditingFinished(e);
      dispatch(setIsEditing(cardIdx));
    }
  };

  // Check container is out of window or not.
  const { windowSize, isSmall, pos, bound } = useContext(MediaContext);
  const { endPos, resetPos } = useMemo(() => {
    if (isSmall) {
      return {
        endPos: 'bottom',
        resetPos: ['left', 'right'],
      } as const;
    } else {
      return {
        endPos: 'right',
        resetPos: ['top', 'bottom'],
      } as const;
    }
  }, [pos, ...windowSize]);
  useLayoutEffect(() => {
    // @ts-expect-error ref === React.MutableRefObject.
    const container = ref.current as HTMLDivElement;
    const rect = container.getBoundingClientRect();
    // Reset style
    container.style[resetPos[0]] = '';
    container.style[resetPos[1]] = '';
    if (isSmall) return;
    // Adjust pos if container is out of window.
    if (rect[pos] <= bound[0]) {
      container.style.transform = 'none';
      container.style[pos] = '0';
    } else if ((rect[endPos]) >= bound[1]) {
      container.style.transform = 'none';
      container.style[pos] = 'auto';
      container.style[endPos] = '0';
    } else {
      container.style.transform = '';
      container.style[pos] = '';
      container.style[endPos] = '';
    }
  }, [isEditing, ...windowSize]);
  // Check container is out of window or not.

  return (
    <div className={css.editing} ref={ref}
      tabIndex={-1}
      onBlur={handleDialogBlurred}
    >
      <div style={{ backgroundColor: card.hex }} />
      <input type="text" ref={hexInputRef} maxLength={7}
        defaultValue={card.hex}
        className={css.hexInput}
        onChange={hexTextEdited}
        onBlur={handleHexEditingFinished}
        onKeyDown={handleHexEditingFinished}
      />
      <div className={css.sliderContainer} >
        {
          roundedColor.map((val, i) => {
            return (
              <Fragment key={`card${cardIdx}-fragment${i}`}>
                <label key={`card${cardIdx}-label${i}`}>
                  {`${labels[i]}: ${val}`}
                </label>
                <Slider key={`card${cardIdx}-slider${i}`}
                  showRange={false} showVal={false}
                  trackerBackground={gradientGen(color, i, colorSpace)}
                  max={maxes[i]} step={1} digit={0}
                  value={val}
                  onChange={(value) => handleSliderChange(value, i)}
                />
              </Fragment>
            );
          })
        }
      </div>
    </div>
  );
});
EditingDialog.displayName = 'EditingWindow';


// Main component
type CardProps = {
  cardIdx: number;
  card: CardType;
  styleInSettings: React.CSSProperties;
  position: string;
  startDraggingCard: MouseHandler;
  handleRemoveCard: () => void;
  handleTransitionEnd: () => void;
}

export type CardHandle = {
  element: HTMLDivElement;
  setSize(size: string): void;
  setPos(pos: string): void;
  setTransDuration(action: 'none' | 'pos' | 'reset'): void;
}

const Card = forwardRef<CardHandle, CardProps>(({
  cardIdx,
  card,
  styleInSettings,
  position,
  startDraggingCard,
  handleTransitionEnd,
  handleRemoveCard,
},
ref,
) => {
  // States / consts
  const { color, hex, isEditing } = card;
  const { colorSpace, numOfCards, isPending } = useAppSelector(selectPlt);
  const { transition } = useAppSelector(selectSettings);
  const { isSmall, pos } = useContext(MediaContext);

  const containerRef = useRef<HTMLDivElement>(null);
  const editingDialogRef = useRef<HTMLDivElement>(null);
  const roundedColor = color.map((val) => Math.round(val));
  const isLight = rgb2gray(hex2rgb(hex) as number[]) > 127;

  const filterStyle = useMemo(() => {
    return {
      display: isPending ? 'none' : '',
      filter: isLight ? '' : 'invert(1)',
    };
  }, [isLight, isPending]);

  const [cardSize, setCardSize] = useState(() => evalLength(numOfCards));
  const [cardPos, setCardPos] = useState(() => position);
  const [transProperty, setTransProperty] = useState(() => '');

  useImperativeHandle(ref, () => {
    return {
      element: containerRef.current as HTMLDivElement,
      setSize(size: string) {
        setCardSize(size);
      },
      setPos(pos: string) {
        setCardPos(pos);
      },
      setTransDuration(action: 'none' | 'reset') {
        switch (action) {
          case 'none':
            setTransProperty('none');
            break;
          case 'reset':
            setTransProperty('');
        }
      },
    };
  }, [transition, isSmall]);

  useLayoutEffect(() => {
    setCardPos(evalPosition(cardIdx, numOfCards));
    setCardSize(evalLength(numOfCards));
  }, [numOfCards]);

  // Focus the dialog when open it.
  useEffect(() => {
    if (isEditing) editingDialogRef.current?.focus();
  }, [isEditing]);

  return (
    <div className={css.cardContainer} ref={containerRef}
      style={{
        ...styleInSettings,
        backgroundColor: hex,
        [isSmall ? 'height' : 'width']: cardSize,
        [pos]: cardPos,
        transitionProperty: transProperty,
      }}
      onTransitionEnd={handleTransitionEnd}
    >
      <ToolBar
        cardIdx={cardIdx}
        numOfCards={numOfCards}
        card={card}
        filterStyle={filterStyle}
        startDraggingCard={startDraggingCard}
        removeCard={handleRemoveCard}
      />
      {
        <div className={css.textDisplay}
          style={{ opacity: isEditing ? '0' : '' }}
        >
          <div className={css.hexText}
            onClick={copyHex}
            style={filterStyle}
          >
            <Icon type="copy" />
            {hex}
          </div>
          <div className={css.rgbText}
            style={filterStyle}
            onClick={copyHex}
          >
            <Icon type="copy" />
            {
              colorSpace === 'name' ?
                getClosestName(color) :
                `${colorSpace}(${roundedColor.toString()})`
            }
          </div>
        </div>
      }
      {
        isEditing &&
        <EditingDialog ref={editingDialogRef}
          cardIdx={cardIdx}
          card={card}
          colorSpace={colorSpace}
          roundedColor={roundedColor}
        />
      }
    </div>
  );
});
Card.displayName = 'Card';
export default Card;
