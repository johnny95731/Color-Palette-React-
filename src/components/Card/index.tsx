import React, {
  Fragment, useMemo, useEffect, useCallback, forwardRef, Ref, useRef,
  useContext,
} from "react";
import css from "./index.scss";
import Icon from "../Icons.tsx";
// utils
import {
  rgb2gray, rgb2hex, hex2rgb, isValidHex, getModeInfos,
} from "../../common/utils/converter.ts";
import {hexTextEdited, copyHex} from "../../common/utils/helpers.ts";
// Redux-relate
import {useAppDispatch, useAppSelector} from "../../common/hooks/storeHooks.ts";
import {
  delCard, refreshCard, editCard, setIsLock, setIsEditing,
} from "../../features/slices/cardSlice.ts";
import {favColorsChanged} from "../../features/slices/favSlice.ts";
import {selectOptions, selectFavorites} from "../../features/store.ts";
import MediaContext from "../../features/mediaContext.ts";
// types
import {MouseHandler} from "../../common/types/eventHandler.ts";
import type {cardType} from "../../features/types/cardType.ts";


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
  filterStyle: {filter: string | undefined};
  events: {
    [key: string]: () => void;
  }
  handleDragReorder: MouseHandler;
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
        events={[["click", events.delCard]]}
      />
      <Icon type={card.isLock ? "lock" : "unlock"}
        style={filterStyle}
        events={[["click", events.isLockChanged]]}
      />
      <Icon type={ifFavIcon}
        style={filterStyle}
        events={[["click", handleFavClick]]}
      />
      <Icon type="move"
        style={{
          ...filterStyle,
          cursor: "grab",
        }}
        events={[["mousedown", handleDragReorder]]}
      />
      <Icon type="refresh"
        style={filterStyle}
        events={[["click", events.refreshCard]]}
      />
      <Icon type="edit"
        style={filterStyle}
        events={[["click", events.isEditingChanged]]}
      />
    </div>
  );
};

const EditingWindow = forwardRef<HTMLDivElement, any>(({
  isSmall,
  cardId,
  card,
  modeColor,
  isEditingChanged,
}: {
  isSmall: boolean;
  cardId: number;
  card: cardType;
  modeColor: number[];
  isEditingChanged: () => void;
}, ref,
) => {
  const optionsState = useAppSelector(selectOptions);
  const {windowSize} = useContext(MediaContext);
  const dispatch = useAppDispatch();
  const {labels, maxes, converter, inverter} = (
    getModeInfos(optionsState.editingMode)
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
      for (let i = 0; i < 3; i++) {
        slider = (
          document.getElementById(`card${cardId}-slider${i}`) as
          HTMLInputElement
        );
        slider.value = String(newModeColor[i]);
      }
      if (text.length === 4) {
        const hex6 = `#${text[1]+text[1]}${text[2]+text[2]}${text[3]+text[3]}`;
        textInput.value = hex6;
      }
    }
  }, [optionsState.editingMode]);

  const handleSliderChange = (
      e: React.ChangeEvent<HTMLInputElement>,
      idx: number) => {
    const target = e.target;
    const newModeColor = [...modeColor];
    newModeColor[idx] = Number(target.value);
    const rgb = inverter(newModeColor);
    dispatch(editCard({idx: cardId, color: rgb}));
    // Edit input
    const textInput = (
      document.getElementById(`card${cardId}-hex`) as HTMLInputElement
    );
    textInput.value = rgb2hex(rgb);
  };

  const handleWindowBlurred = useCallback((
      e: React.FocusEvent<HTMLInputElement>,
  ) => {
    if (card.isEditing && e.relatedTarget === null) {
      handleHexEditingFinished(e);
      isEditingChanged();
    }
  }, [card.isEditing]);

  // Check container is out of window or not.
  // @ts-expect-error ref === React.MutableRefObject.
  const rect = ref.current?.getBoundingClientRect();
  useEffect(() => {
    // @ts-expect-error ref === React.MutableRefObject.
    const rect = ref.current.getBoundingClientRect();
    if (rect.x <= 0) {
      // @ts-expect-error ref === React.MutableRefObject.
      ref.current.style.transform = "none";
      // @ts-expect-error ref === React.MutableRefObject.
      ref.current.style.left = "0";
    } else if ((rect.x + rect.width) >= windowSize[1]) {
      // @ts-expect-error ref === React.MutableRefObject.
      ref.current.style.transform = "none";
      // @ts-expect-error ref === React.MutableRefObject.
      ref.current.style.left = "auto";
      // @ts-expect-error ref === React.MutableRefObject.
      ref.current.style.right = "0";
    } else {
      // @ts-expect-error ref === React.MutableRefObject.
      ref.current.style.transform = "";
      // @ts-expect-error ref === React.MutableRefObject.
      ref.current.style.left = "";
      // @ts-expect-error ref === React.MutableRefObject.
      ref.current.style.right = "";
    }
  }, [card.isEditing, rect?.x]);

  return (
    <div className={css.editing} ref={ref}
      tabIndex={-1}
      onBlur={handleWindowBlurred}
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
      <form className={css.sliders} >
        {
          labels.map((label, i) => {
            return (
              <Fragment key={`card${cardId}-frag${i}`}>
                <span key={`card${cardId}-label${i}`}
                  // style={filterStyle}
                >
                  {`${label}: ${modeColor[i]}`}
                </span>
                <input key={`card${cardId}-slider${i}`}
                  id={`card${cardId}-slider${i}`}
                  type="range" min="0" max={maxes[i]}
                  defaultValue={modeColor[i]}
                  onChange={(e) => handleSliderChange(e, i)}
                />
              </Fragment>
            );
          })
        }
      </form>
    </div>
  );
});
EditingWindow.displayName = "EditingWindow";


// Main component
const Card = forwardRef(({
  cardId,
  numOfCards,
  card,
  isSmall,
  handleDraggingCard,
}: {
  cardId: number;
  numOfCards: number;
  card: cardType;
  isSmall: boolean;
  handleDraggingCard: MouseHandler;
},
ref: Ref<HTMLDivElement>,
) => {
  // States / consts
  const optionsState = useAppSelector(selectOptions);
  const dispatch = useAppDispatch();
  const {converter} = (
    getModeInfos(optionsState.editingMode)
  );
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [
    isLight,
    modeColor,
  ] = useMemo(() => {
    return [
      rgb2gray(card.rgb) > 127,
      converter(card.rgb),
    ];
  }, [...card.rgb, optionsState.editingMode]);

  const filterStyle = useMemo(() => {
    return {filter: isLight ? "" : "invert(1)"};
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

  useEffect(() => {
    if (card.isEditing) {
      let slider;
      for (let i = 0; i < 3; i++) {
        slider = (
          document.getElementById(`card${cardId}-slider${i}`) as
          HTMLInputElement
        );
        slider.value = String(modeColor[i]);
      }
    }
  }, [optionsState.editingMode]);

  return (
    <div className={css.cardContainer}
      style={{
        backgroundColor: card.hex,
        // transition: "background-color .5s ease",
      }}
      ref={ref}
    >
      <ToolBar
        numOfCards={numOfCards}
        card={card}
        filterStyle={filterStyle}
        events={events}
        handleDragReorder={handleDraggingCard}
      />
      <div className={css.textDisplay}>
        <div className={css.hexText}
          onClick={copyHex}
          style={filterStyle}
        >
          <Icon type="copy"
            style={filterStyle}
          />
          {card.hex}
        </div>
        <div className={css.rgbText}
          style={filterStyle}
          onClick={copyHex}
        >
          <Icon type="copy"
            style={filterStyle}
          />
          {`${optionsState.editingMode}(${modeColor.toString()})`}
        </div>
      </div>
      {
        card.isEditing &&
        <EditingWindow ref={containerRef}
          isSmall={isSmall}
          cardId={cardId}
          card={card}
          modeColor={modeColor}
          isEditingChanged={events.isEditingChanged}
        />
      }
    </div>
  );
});
Card.displayName = "Card";
export default Card;
