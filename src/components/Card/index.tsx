import React, {
  Fragment, useState, useMemo, useEffect, useCallback, forwardRef, Ref,
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
  delCard, lockCard, refreshCard, editCard,
} from "../../features/slices/cardSlice.ts";
import {favColorsChanged} from "../../features/slices/favSlice.ts";
import {
  selectCard, selectOptions, selectFavorites,
} from "../../features/store.ts";
// types
import {MouseEventHandler} from "../../common/types/eventHandler.ts";
import type {cardStateType} from "../../features/types/cardType.ts";


// Other Components
const ToolBar = ({
  hex,
  lockIcon,
  filterStyle,
  events,
  handleDragReorder,
}: {
  hex: string;
  lockIcon: string;
  filterStyle: {filter: string | undefined};
  events: {
    [key: string]: () => void;
  }
  handleDragReorder: MouseEventHandler;
}) => {
  // States / consts
  const [isFav, setIsFav] = useState(() => false);
  const cardState = useAppSelector(selectCard);
  const favState = useAppSelector(selectFavorites);
  const dispatch = useAppDispatch();

  const [opacity, cursor] = useMemo(() => {
    return cardState.numOfCards === 2 ? ["0", "default"] : ["", "pointer"];
  }, [cardState.numOfCards]);

  const ifFavIcon = isFav ? "fav" : "unfav";

  const handleFavClick = () => {
    setIsFav((prev) => !prev);
    dispatch(favColorsChanged({targetHex: hex}));
  };

  useEffect(() => { // When card color changed or fav list changed.
    setIsFav(favState.colors.includes(hex));
  }, [hex, favState.colors.length]);

  useEffect(() => { // After favState initialized.
    setIsFav(favState.colors.includes(hex));
  }, [favState.isInitialized[0]]);

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
      <Icon type={lockIcon}
        style={filterStyle}
        events={[["click", events.lockCard]]}
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


// Main component
const Card = forwardRef(({
  cardId,
  cardState,
  handleDragReorder,
}: {
  cardId: number;
  cardState: cardStateType;
  handleDragReorder: MouseEventHandler;
},
ref: Ref<HTMLDivElement>,
) => {
  // States / consts
  const optionsState = useAppSelector(selectOptions);
  const dispatch = useAppDispatch();
  const [isEditing, setIsEditing] = useState(() => false);
  const {labels, maxes, converter, inverter} = (
    getModeInfos(optionsState.editMode));

  const [
    isLight,
    modeColor,
  ] = useMemo(() => {
    return [
      rgb2gray(cardState.rgb) > 127,
      converter(cardState.rgb),
    ];
  }, [...cardState.rgb, optionsState.editMode]);

  const filterStyle = useMemo(() => {
    return {filter: isLight ? undefined : "invert(1)"};
  }, [isLight]);

  const events = useMemo(() => {
    return {
      delCard: () => {
        dispatch(delCard({idx: cardId}));
      },
      lockCard: () => {
        dispatch(lockCard({idx: cardId}));
      },
      refreshCard: () => {
        dispatch(refreshCard({idx: cardId}));
      },
      isEditingChanged: () => {
        setIsEditing((prev) => !prev);
      },
    };
  }, [cardId]);

  const handleHexBlur = useCallback((
      e: React.FocusEvent<HTMLInputElement>,
  ) => {
    const textInput = e.target;
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
  }, []);

  const handleSliderChange = (
      e: React.ChangeEvent<HTMLInputElement>,
      idx: number) => {
    const target = e.target;
    const newModeColor = [...modeColor];
    newModeColor[idx] = Number(target.value);
    const rgb = inverter(newModeColor);
    editCard({idx: cardId, color: rgb});
    // Edit input
    const textInput = (
      document.getElementById(`card${cardId}-hex`) as HTMLInputElement
    );
    textInput.value = rgb2hex(rgb);
  };

  useEffect(() => {
    if (isEditing) {
      let slider;
      for (let i = 0; i < 3; i++) {
        slider = (
          document.getElementById(`card${cardId}-slider${i}`) as
          HTMLInputElement
        );
        slider.value = String(modeColor[i]);
      }
    }
  }, [optionsState.editMode]);

  return (
    <div
      className={css.cardContainer}
      style={{
        backgroundColor: cardState.hex,
        // transition: "background-color .5s ease",
      }}
      ref={ref}
    >
      <ToolBar
        hex={cardState.hex}
        lockIcon={cardState.isLock ? "lock" : "unlock"}
        filterStyle={filterStyle}
        events={events}
        handleDragReorder={handleDragReorder}
      />
      <div className={css.textRegion}>
        {
          !isEditing ?
          <>
            <div className={css.hexText}
              onClick={copyHex}
              style={filterStyle}
            >
              <Icon type="copy"
                style={filterStyle}
              />
              {cardState.hex}
            </div>
            <div className={css.rgbText}
              style={filterStyle}
              onClick={copyHex}
            >
              <Icon type="copy"
                style={filterStyle}
              />
              {`${optionsState.editMode}(${modeColor.toString()})`}
            </div>
          </> : // Editing mode
          <>
            <input type="text" maxLength={7}
              defaultValue={cardState.hex}
              id={`card${cardId}-hex`}
              className={css.hexInput}
              onChange={hexTextEdited}
              onBlur={handleHexBlur}
            />
            <form className={css.sliders}
            >
              {
                labels.map((label, i) => {
                  return (
                    <Fragment key={`card${cardId}-frag${i}`}>
                      <span key={`card${cardId}-label${i}`}
                        style={filterStyle}
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
          </>
        }
      </div>
    </div>
  );
});
Card.displayName = "Card";
export default Card;
