import React, {
  useMemo, useCallback, forwardRef, useRef, useContext, useState,
  useLayoutEffect, useImperativeHandle, Fragment,
} from 'react';
import css from './card.module.scss';
import Icon from '../Customs/Icons.tsx';
import Slider from '../Customs/Slider.tsx';
import Select, { SelectExposed } from '../Customs/Select.tsx';
// utils
import {
  rgb2gray, rgb2hex, hex2rgb, isValidHex, getSpaceInfos, getSpaceTrans,
  gradientGen, namedColors
} from 'utils/colors.ts';
import { hexTextEdited, copyHex } from 'utils/eventHandler.ts';
// Stores
import {
  useAppDispatch, useAppSelector, selectPlt, selectFavorites, selectSettings,
} from '@/features';
import {
  refreshCard, editCard, setIsLock, setEditingIdx,
} from 'slices/pltSlice.ts';
import { favColorsChanged } from 'slices/favSlice.ts';
import MediaContext from '@/features/mediaContext.ts';
// types
import type { MouseHandler, TouchHandler } from 'types/eventHandler.ts';
import type { CardType } from 'types/pltType.ts';
import { toClass } from '@/common/utils/helpers.ts';


// Other Components
const ToolBar = ({
  cardIdx,
  card,
  filterStyle,
  startDraggingCard,
  removeCard,
}: {
  cardIdx: number;
  card: CardType;
  filterStyle: React.CSSProperties;
  startDraggingCard: MouseHandler | TouchHandler;
  removeCard: () => void;
}) => {
  // States / consts
  const { isPending, editingIdx, numOfCards } = useAppSelector(selectPlt);
  const { colors: favColors, isInit } = useAppSelector(selectFavorites);
  const { isSmall } = useContext(MediaContext);
  const isFav = useMemo(() => {
    return favColors.includes(card.hex);
  }, [card.hex, favColors.length, isInit[0]]);
  const dispatch = useAppDispatch();
  
  const showToolbar = useMemo(() => {
    return {
      ...filterStyle,
      display: isPending ? 'none' : undefined,
      opacity: (editingIdx === cardIdx && !isSmall) ? '0' : ''
    };
  }, [isPending, editingIdx, isSmall, filterStyle]);

  const closingIconStyle = useMemo(() => {
    return numOfCards === 2 ?
      {
        opacity: '0',
        cursor: 'default',
      } : undefined;
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
        dispatch(setEditingIdx(cardIdx));
      },
    };
  }, [cardIdx]);

  const ifFavIcon = isFav ? 'fav' : 'unfav';
  const handleFavClick = () => {
    dispatch(favColorsChanged(card.hex));
  };

  return (
    <div
      className={css.toolContainer}
      style={showToolbar}
    >
      <Icon type="close"
        style={closingIconStyle}
        onClick={removeCard}
      />
      <Icon type={card.isLock ? 'lock' : 'unlock'}
        onClick={events.isLockChanged}
      />
      <Icon type={ifFavIcon}
        onClick={handleFavClick}
      />
      <Icon type="move"
        style={{
          cursor: 'grab',
        }}
        onMouseDown={startDraggingCard as MouseHandler}
        onTouchStart={startDraggingCard as TouchHandler}
      />
      <Icon type="refresh"
        onClick={events.refreshCard}
      />
      <Icon type="edit"
        onClick={events.isEditingChanged}
      />
    </div>
  );
};

const EditingDialog = forwardRef<HTMLDivElement, any>(({
  cardIdx,
  card,
  detail,
  roundedColor,
}: {
  cardIdx: number;
  card: CardType;
  detail: string;
  roundedColor: number[];
}, ref,
) => {
  const { editingIdx, colorSpace } = useAppSelector(selectPlt);
  const dispatch = useAppDispatch();
  const { color } = card;

  const hexInputRef = useRef<HTMLInputElement>(null);

  const isOpened = useMemo(() => editingIdx === cardIdx, [editingIdx, cardIdx]);
  const { labels, range, converter, inverter } = useMemo(() => {
    const info = getSpaceInfos(colorSpace);
    return {
      ...getSpaceTrans(colorSpace),
      labels: info.labels,
      range: info.range.map((vals) =>
        typeof vals === 'number' ?
          [0, vals] :
          [...vals]
      )
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
      // Update DOM
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


  const { isSmall, pos, bound, windowSize } = useContext(MediaContext);
  useLayoutEffect(() => {
    // Check container is out of window or not.
    const { endPos, resetPos } = (
      isSmall ?
        {
          endPos: 'bottom',
          resetPos: ['left', 'right'],
        } as const:
        {
          endPos: 'right',
          resetPos: ['top', 'bottom'],
        } as const
    );
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
  }, [windowSize]);
  
  const selectRef = useRef<SelectExposed>(null);
  const selectName = (idx: number) => {
    dispatch(editCard({ idx: cardIdx, color: namedColors.getRgb(idx) }));
    selectRef.current?.select(idx);
  };

  return (
    <div
      ref={ref}
      className={css.editor}
      style={{
        display: isOpened ? undefined : 'none'
      }}
    >
      <div style={{ backgroundColor: card.hex }} />
      <label></label>
      <input
        ref={hexInputRef}
        className={css.hexInput}
        type="text"
        maxLength={7}
        defaultValue={card.hex}
        onChange={hexTextEdited}
        onBlur={handleHexEditingFinished}
        onKeyDown={handleHexEditingFinished}
      />
      {
        colorSpace === 'name' &&
          <Select
            ref={selectRef}
            options={namedColors.fullNames}
            titleClass={css.nameSelectTitle}
            contentClass={css.nameSelectContent}
            value={detail}
          >
            {
              namedColors.fullNames.map((name, i) => (
                <li key={`Option ${name}`}
                  style={selectRef.current?.liStyle(i)}
                  onClick={() => selectName(i)}
                >
                  <button>
                    <span
                      style={{
                        backgroundColor: name.replace(/\s/g, '')
                      }}
                    />
                    {name}
                  </button>
                </li>
              ))
            }
          </Select>
      }
      {
        <div className={css.sliderContainer} >
          {
            roundedColor.map((val, i) => {
              return (
                <Fragment key={`card${cardIdx}-fragment${i}`}>
                  <label
                    key={`card${cardIdx}-label${i}`}
                    htmlFor={`card${cardIdx}-slider${i}`}
                  >
                    {`${labels[i]}: ${val}`}
                  </label>
                  <Slider key={`card${cardIdx}-slider${i}`}
                    id={`card${cardIdx}-slider${i}`}
                    showRange={false}
                    showVal={false}
                    trackerBackground={gradientGen(color, i, colorSpace)}
                    pointBackground={card.hex}
                    min={range[i][0]}
                    max={range[i][1]}
                    step={1}
                    value={val}
                    onChange={(value) => handleSliderChange(value, i)}
                  />
                </Fragment>
              );
            })
          }
        </div>
      }
    </div>
  );
});
EditingDialog.displayName = 'EditingWindow';


// Main component
type CardProps = {
  cardIdx: number;
  card: CardType;
  styleInSettings: React.CSSProperties;
  length: number | string,
  position: string;
  startDraggingCard: MouseHandler;
  handleRemoveCard: () => void;
  handleTransitionEnd: () => void;
}

export type CardExposed = {
  element: HTMLDivElement;
  setSize(size: string): void;
  setPos(pos: string): void;
  setTransDuration(action: 'none' | 'pos' | 'reset'): void;
}

const Card = forwardRef<CardExposed, CardProps>(({
  cardIdx,
  card,
  styleInSettings,
  length,
  position,
  startDraggingCard,
  handleTransitionEnd,
  handleRemoveCard,
},
ref,
) => {
  // States / consts
  const { color, hex } = card;
  const { colorSpace, numOfCards, editingIdx } = useAppSelector(selectPlt);
  const { transition } = useAppSelector(selectSettings);
  const { isSmall, pos } = useContext(MediaContext);

  const containerRef = useRef<HTMLDivElement>(null);
  const editingDialogRef = useRef<HTMLDivElement>(null);
  
  const { roundedColor, isLight, detail } = useMemo(() => {
    const roundedColor = color.map((val) => Math.round(val));
    return {
      roundedColor,
      isLight: rgb2gray(hex2rgb(hex) as number[]) > 127,
      detail: (
        colorSpace === 'name' ?
          namedColors.fullNames[namedColors.getClosestIdx(card.color)] :
          `${colorSpace}(${roundedColor.toString()})`
      )
    };
  }, [hex, colorSpace]); // color and hex are related

  const fgFilter = useMemo(() => {
    return {
      filter: isLight ? '' : 'invert(1)',
    };
  }, [isLight]);

  const classes = useMemo(() => {
    return toClass([
      css.cardContainer,
      cardIdx === 0 ? css.first : undefined,
      cardIdx === numOfCards - 1 ? css.last : undefined
    ]);
  }, [cardIdx, numOfCards]);

  // states for dealing transition.
  const [cardSize, setCardSize] = useState<number | string>(() => length);
  const [cardPos, setCardPos] = useState(() => position);
  const [transProperty, setTransProperty] = useState(() => '');

  useImperativeHandle(ref, () => {
    return {
      element: containerRef.current as HTMLDivElement,
      setSize(size: number | string) {
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
    setCardPos(position);
    setCardSize(length);
  }, [numOfCards]);

  return (
    <div
      ref={containerRef}
      className={classes}
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
        card={card}
        filterStyle={fgFilter}
        startDraggingCard={startDraggingCard}
        removeCard={handleRemoveCard}
      />
      {
        // Color string
        <div className={css.textDisplay}
        >
          <div className={css.hexText}
            onClick={copyHex}
            style={fgFilter}
          >
            <Icon type="copy" />
            {hex}
          </div>
          <div
            className={css.detailText}
            style={fgFilter}
            onClick={copyHex}
          >
            <Icon type="copy" />
            {
              detail
            }
          </div>
        </div>
      }
      {
        editingIdx === cardIdx &&
        <EditingDialog
          ref={editingDialogRef}
          cardIdx={cardIdx}
          card={card}
          detail={detail}
          colorSpace={colorSpace}
          roundedColor={roundedColor}
        />
      }
    </div>
  );
});
Card.displayName = 'Card';
export default Card;
