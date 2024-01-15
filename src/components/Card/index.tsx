import React, {
  Fragment, useMemo, useEffect, useCallback, forwardRef, Ref, useRef,
  useContext,
} from "react";
import css from "./index.scss";
import Icon from "../Icons.tsx";
// utils
import {
  rgb2gray, rgb2hex, hex2rgb, isValidHex, getSpaceInfos,
} from "@/common/utils/colors.ts";
import {hexTextEdited, copyHex} from "@/common/utils/helpers.ts";
// Stores
import {selectOptions, selectFavorites} from "@/features/store.ts";
import {useAppDispatch, useAppSelector} from "@/common/hooks/storeHooks.ts";
import {
  delCard, refreshCard, editCard, setIsLock, setIsEditing,
} from "slices/cardSlice.ts";
import {favColorsChanged} from "slices/favSlice.ts";
import MediaContext from "@/features/mediaContext.ts";
// types
import type {MouseHandler, TouchHandler} from "types/eventHandler.ts";
import type {cardType} from "types/cardType.ts";
import type {ColorSpacesType} from "types/optionsType.ts";


// Other Components
const ToolBar = ({
  numOfCards,
  card,
  filterStyle,
  events,
  handleDragReorder,
}: {
  numOfCards: number;
  card: cardType;
  filterStyle: {filter: string} | undefined;
  events: {
    [key: string]: () => void;
  }
  handleDragReorder: MouseHandler | TouchHandler;
}) => {
  // States / consts
  const favState = useAppSelector(selectFavorites);
  const isFav = useMemo(() => {
    return favState.colors.includes(card.hex);
  }, [card.hex, favState.colors.length, favState.isInitialized[0]]);
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
        onClick={events.delCard}
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
  card: cardType;
  colorSpace: ColorSpacesType
  colorArr: number[];
}, ref,
) => {
  const {colorSpace: editingMode} = useAppSelector(selectOptions);
  const dispatch = useAppDispatch();
  const {labels, maxes, converter, inverter} = (
    getSpaceInfos(editingMode)
  );

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
      const newModeColor = converter(rgb);
      dispatch(editCard({idx: cardId, color: rgb}));
      let slider;
      for (let i = 0; i < 4; i++) {
        slider = (
          document.getElementById(`card${cardId}-slider${i}`) as
          HTMLInputElement
        );
        if (slider) slider.value = String(newModeColor[i]);
      }
      if (text.length === 4) {
        const hex6 = `#${text[1]+text[1]}${text[2]+text[2]}${text[3]+text[3]}`;
        textInput.value = hex6;
      }
    }
  }, [editingMode]);

  /**
   * Slider changed event.
   */
  const handleSliderChange = (
      e: React.ChangeEvent<HTMLInputElement>,
      idx: number) => {
    const target = e.target;
    const newColorArr = converter(card.rgb);
    newColorArr[idx] = Number(target.value);
    const rgb = inverter(newColorArr);
    dispatch(editCard({idx: cardId, color: rgb}));
    // Set hex to hex input.
    const textInput = (
      document.getElementById(`card${cardId}-hex`) as HTMLInputElement
    );
    textInput.value = rgb2hex(rgb);
  };

  const handleDialogBlurred = (e: React.FocusEvent<HTMLInputElement>) => {
    if (card.isEditing && e.relatedTarget === null) {
      handleHexEditingFinished(e);
      dispatch(setIsEditing(cardId));
    }
  };

  // Check container is out of window or not.
  const {
    windowSize, isSmall, pos, bound,
  } = useContext(MediaContext);
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
  useEffect(() => {
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
              <Fragment key={`card${cardId}-frag${i}`}>
                <label key={`card${cardId}-label${i}`}>
                  {`${labels[i]}: ${val}`}
                  <input key={name} id={name}
                    type="range" min="0" max={maxes[i]} step={0.01}
                    defaultValue={val}
                    onChange={(e) => handleSliderChange(e, i)}
                  />
                </label>
              </Fragment>
            );
          })
        }
      </div>
    </div>
  );
});
EditingDialog.displayName = "EditingWindow";


// Main component
const Card = forwardRef(({
  cardId,
  numOfCards,
  card,
  handleDraggingCard,
}: {
  cardId: number;
  numOfCards: number;
  card: cardType;
  handleDraggingCard: MouseHandler;
},
ref: Ref<HTMLDivElement>,
) => {
  // States / consts
  const {rgb, hex, isEditing} = card;
  const {colorSpace} = useAppSelector(selectOptions);
  const dispatch = useAppDispatch();
  const {converter} = (
    getSpaceInfos(colorSpace)
  );
  const editingDialogRef = useRef<HTMLDivElement | null>(null);

  const {
    isLight,
    colorArr,
  } = useMemo(() => {
    return {
      isLight: rgb2gray(rgb) > 127,
      colorArr: converter(rgb).map((val) => Math.round(val)),
    };
  }, [...rgb, colorSpace]);

  const filterStyle = useMemo(() => {
    return isLight ? undefined : {filter: "invert(1)"};
  }, [isLight]);

  /**
   * Toolbar events.
   */
  const events = useMemo(() => {
    return {
      delCard: () => {
        dispatch(delCard(cardId));
      },
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
    <div className={css.cardContainer} ref={ref}
      style={{backgroundColor: hex}}
    >
      <ToolBar
        numOfCards={numOfCards}
        card={card}
        filterStyle={filterStyle}
        events={events}
        handleDragReorder={handleDraggingCard}
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
            {`${colorSpace}(${
              colorArr.toString()
            })`}
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
