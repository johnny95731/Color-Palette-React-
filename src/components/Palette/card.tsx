import React, {
  useMemo, useEffect, useCallback, forwardRef, useRef, useContext, useState,
  useLayoutEffect, useImperativeHandle,
} from "react";
import css from "./card.scss";
import Icon from "../Customs/Icons.tsx";
// utils
import {
  rgb2gray, rgb2hex, hex2rgb, isValidHex, getSpaceInfos,
  getSpaceTrans,
} from "@/common/utils/colors.ts";
import {
  getClosestName, hexTextEdited, copyHex,
  toPercent,
} from "@/common/utils/helpers.ts";
// Stores
import {
  useAppDispatch, useAppSelector, selectPlt, selectFavorites,
  selectSettings,
} from "@/features";
import {
  refreshCard, editCard, setIsLock, setIsEditing,
} from "@/features/slices/pltSlice.ts";
import {favColorsChanged} from "slices/favSlice.ts";
import MediaContext from "@/features/mediaContext.ts";
// types
import type {MouseHandler, TouchHandler} from "types/eventHandler.ts";
import type {CardType, ColorSpacesType} from "types/pltType.ts";


// Other Components
const ToolBar = ({
  numOfCards,
  card,
  filterStyle,
  events,
  handleDragReorder,
  removeCard,
}: {
  numOfCards: number;
  card: CardType;
  filterStyle: {filter: string} | undefined;
  events: {
    [key: string]: () => void;
  }
  handleDragReorder: MouseHandler | TouchHandler;
  removeCard: () => void;
}) => {
  // States / consts
  const favState = useAppSelector(selectFavorites);
  const isFav = useMemo(() => {
    return favState.colors.includes(card.hex);
  }, [card.hex, favState.colors.length, favState.isInit[0]]);
  const dispatch = useAppDispatch();

  const {opacity, cursor} = useMemo(() => {
    if (numOfCards === 2) {
      return {
        opacity: "0",
        cursor: "default",
      };
    } else {
      return {
        opacity: "",
        cursor: "pointer",
      };
    }
  }, [numOfCards]);

  const ifFavIcon = isFav ? "fav" : "unfav";

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
      <Icon type={card.isLock ? "lock" : "unlock"}
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
          cursor: "grab",
        }}
        onMouseDown={handleDragReorder as MouseHandler}
        onTouchStart={handleDragReorder as TouchHandler}
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
  cardId,
  card,
  colorSpace,
  colorArr,
}: {
  cardId: number;
  card: CardType;
  colorSpace: ColorSpacesType
  colorArr: number[];
}, ref,
) => {
  const dispatch = useAppDispatch();

  const {labels, maxes, converter, inverter} = useMemo(() => {
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
    if (e.type === "keydown" && (e as React.KeyboardEvent).key !== "Enter") {
      return;
    }
    const textInput = e.currentTarget;
    const text = textInput.value;
    if (isValidHex(text)) {
      const rgb = hex2rgb(text);
      if (!rgb) return;
      const newColor = converter(rgb);
      dispatch(editCard({idx: cardId, color: newColor}));
      let slider;
      for (let i = 0; i < 4; i++) {
        slider = (
          document.getElementById(`card${cardId}-slider${i}`) as
          HTMLInputElement
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
  const handleSliderChange = (
      e: React.ChangeEvent<HTMLInputElement>,
      idx: number) => {
    const target = e.target;
    const newColorArr = [...card.color];
    newColorArr[idx] = Number(target.value);
    dispatch(editCard({idx: cardId, color: newColorArr}));
    // Set hex to hex input.
    const textInput = (
      document.getElementById(`card${cardId}-hex`) as HTMLInputElement
    );
    const rgb = inverter(newColorArr);
    textInput.value = rgb2hex(rgb);
  };

  const handleDialogBlurred = (e: React.FocusEvent<HTMLInputElement>) => {
    if (card.isEditing && e.relatedTarget === null) {
      handleHexEditingFinished(e);
      dispatch(setIsEditing(cardId));
    }
  };

  // Check container is out of window or not.
  const {windowSize, isSmall, pos, bound} = useContext(MediaContext);
  const {endPos, resetPos} = useMemo(() => {
    if (isSmall) {
      return {
        endPos: "bottom",
        resetPos: ["left", "right"],
      } as const;
    } else {
      return {
        endPos: "right",
        resetPos: ["top", "bottom"],
      } as const;
    }
  }, [pos, ...windowSize]);
  useLayoutEffect(() => {
    // @ts-expect-error ref === React.MutableRefObject.
    const container = ref.current as HTMLDivElement;
    const rect = container.getBoundingClientRect();
    // Reset style
    container.style[resetPos[0]] = "";
    container.style[resetPos[1]] = "";
    if (isSmall) return;
    // Adjust pos if container is out of window.
    if (rect[pos] <= bound[0]) {
      container.style.transform = "none";
      container.style[pos] = "0";
    } else if ((rect[endPos]) >= bound[1]) {
      container.style.transform = "none";
      container.style[pos] = "auto";
      container.style[endPos] = "0";
    } else {
      container.style.transform = "";
      container.style[pos] = "";
      container.style[endPos] = "";
    }
  }, [card.isEditing, ...windowSize]);
  // Check container is out of window or not.

  // Change slider value when color space changed.
  useEffect(() => {
    if (card.isEditing) {
      let slider;
      for (let i = 0; i < 4; i++) {
        slider = (
          document.getElementById(`card${cardId}-slider${i}`)
        );
        if (slider) (slider as HTMLInputElement).value = String(colorArr[i]);
      }
    }
  }, [colorSpace, colorArr]);

  return (
    <div className={css.editing} ref={ref}
      tabIndex={-1}
      onBlur={handleDialogBlurred}
    >
      <div style={{backgroundColor: card.hex}}>
      </div>
      <input type="text" maxLength={7}
        defaultValue={card.hex}
        id={`card${cardId}-hex`}
        className={css.hexInput}
        onChange={hexTextEdited}
        onBlur={handleHexEditingFinished}
        onKeyDown={handleHexEditingFinished}
      />
      <div className={css.sliders} >
        {
          colorArr.map((val, i) => {
            const name = `card${cardId}-slider${i}`;
            return (
              <label key={`card${cardId}-label${i}`}>
                {`${labels[i]}: ${val}`}
                <input key={name} id={name}
                  type="range" min="0" max={maxes[i]} step={0.01}
                  defaultValue={val}
                  onChange={(e) => handleSliderChange(e, i)}
                />
              </label>
            );
          })
        }
      </div>
    </div>
  );
});
EditingDialog.displayName = "EditingWindow";


// Main component

type CardProps = {
  cardId: number;
  card: CardType;
  borderStyle: React.CSSProperties;
  isExcutingTrans: boolean;
  position: string;
  removeCardTransition: () => void;
  handleTransitionEnd: () => void;
  handleDraggingCard: MouseHandler;
}

export type CardHandle = {
  element: HTMLDivElement;
  setSize(size: string): void;
  setPos(pos: string): void;
  setTransDuration(action: "none" | "pos" | "reset"): void;
}

const Card = forwardRef<CardHandle, CardProps>(({
  cardId,
  card,
  borderStyle,
  isExcutingTrans,
  position,
  handleDraggingCard,
  handleTransitionEnd,
  removeCardTransition,
},
ref,
) => {
  // States / consts
  const dispatch = useAppDispatch();
  const {color, hex, isEditing} = card;
  const {colorSpace, numOfCards} = useAppSelector(selectPlt);
  const {transition} = useAppSelector(selectSettings);
  const {isSmall, pos} = useContext(MediaContext);

  const containerRef = useRef<HTMLDivElement>(null);
  const editingDialogRef = useRef<HTMLDivElement>(null);


  const colorArr = color.map((val) => Math.round(val));
  const isLight = rgb2gray(hex2rgb(hex) as number[]) > 127;

  const filterStyle = useMemo(() => {
    return {
      display: isExcutingTrans ? "none" : "",
      filter: isLight ? "" : "invert(1)",
    };
  }, [isLight, isExcutingTrans]);

  const [cardSize, setCardSize] = useState(
      () => `${toPercent(1 / numOfCards, 2)}%`,
  );
  const [cardPos, setCardPos] = useState(() => position);
  const [transDuration, setTransDuration] = useState(() =>
    `${transition.pos}ms, ${transition.pos}ms, ${transition.color}ms`,
  );

  useImperativeHandle(ref, () => {
    return {
      element: containerRef.current as HTMLDivElement,
      setSize(size: string) {
        setCardSize(size);
      },
      setPos(pos: string) {
        setCardPos(pos);
      },
      setTransDuration(action: "none" | "pos" | "color" | "reset") {
        switch (action) {
          case "none":
            setTransDuration("");
            break;
          case "color":
            setTransDuration(`0ms, 0ms, ${transition.color}ms`);
            break;
          case "pos":
            setTransDuration(`${transition.pos}ms, 0ms`);
            break;
          case "reset":
            setTransDuration(
                `${transition.pos}ms, ${transition.pos
                }ms, ${transition.color}ms`,
            );
        }
      },
    };
  }, [transition]);

  /**
   * Toolbar events.
   */
  const events = useMemo(() => {
    return {
      refreshCard: () => {
        dispatch(refreshCard(cardId));
      },
      isLockChanged: () => {
        dispatch(setIsLock(cardId));
      },
      isEditingChanged: () => {
        dispatch(setIsEditing(cardId));
      },
    };
  }, [cardId]);

  // Focus the dialog when open it.
  useEffect(() => {
    if (isEditing) editingDialogRef.current?.focus();
  }, [isEditing]);

  return (
    <div className={css.cardContainer} ref={containerRef}
      style={{
        ...borderStyle,
        backgroundColor: hex,
        [isSmall ? "height" : "width"]: cardSize,
        [pos]: cardPos,
        transitionDuration: transDuration,
      }}
      onTransitionEnd={handleTransitionEnd}
    >
      <ToolBar
        numOfCards={numOfCards}
        card={card}
        filterStyle={filterStyle}
        events={events}
        handleDragReorder={handleDraggingCard}
        removeCard={removeCardTransition}
      />
      {
        <div className={css.textDisplay}
          style={{opacity: isEditing ? "0" : ""}}
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
              colorSpace === "name" ?
                getClosestName(color) :
                `${colorSpace}(${colorArr.toString()})`
            }
          </div>
        </div>
      }
      {
        isEditing &&
        <EditingDialog ref={editingDialogRef}
          cardId={cardId}
          card={card}
          colorSpace={colorSpace}
          colorArr={colorArr}
        />
      }
    </div>
  );
});
Card.displayName = "Card";
export default Card;
