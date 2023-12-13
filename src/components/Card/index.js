import React, {
  Fragment, useState, useMemo, useEffect, useCallback, useRef, forwardRef
} from "react";
import Icon from "../Icons.jsx";
import css from "./index.scss";

import {rgb2gray, rgb2hex, hex2rgb, isValidHex} from "../../utils/converter.js";
import {hexTextEdited, copyHex} from "../../utils/helpers.js";

// Main component
const Card = forwardRef(({
  cardId,
  totalNum,
  cardState,
  ifFav,
  delCard,
  lockCard,
  favChanged,
  refresh,
  handleDragReorder,
  editCard,
  editMode,
  infos: {labels, maxes, converter, inverter},
}, ref) => {
  // States / consts
  const [isEditing, setIsEditing] = useState(() => false);

  const [
    isLight,
    modeColor,
  ] = useMemo(() => {
    return [
      rgb2gray(cardState.color) > 127,
      converter(cardState.color),
    ];
  }, [...cardState.color, editMode]);

  const styleFilter = useMemo(() => {
    return {filter: isLight ? undefined : "invert(1)"};
  }, [isLight]);

  // Events
  const handleHexBlur = useCallback((e) => {
    const textInput = (e.target || e.srcElement);
    const text = textInput.value;
    if (isValidHex(text)) {
      const rgb = hex2rgb(text);
      const newModeColor = converter(rgb);
      editCard(cardId, rgb);
      let slider;
      for (let i = 0; i < 3; i++) {
        slider = document.getElementById(`card${cardId}-slider${i}`);
        slider.value = newModeColor[i];
      }
      if (text.length === 4) {
        const hex6 = `#${text[1]+text[1]}${text[2]+text[2]}${text[3]+text[3]}`;
        textInput.value = hex6;
      }
    }
  }, []);

  const handleSliderChange = (e, idx) => {
    const target = (e.target || e.srcElement);
    const newModeColor = [...modeColor];
    newModeColor[idx] = Number(target.value);
    const rgb = inverter(newModeColor);
    editCard(cardId, rgb);
    // Edit input
    const textInput = document.getElementById(`card${cardId}-hex`);
    textInput.value = rgb2hex(rgb);
  };

  useEffect(() => {
    if (isEditing) {
      let slider;
      for (let i = 0; i < 3; i++) {
        slider = document.getElementById(`card${cardId}-slider${i}`);
        slider.value = modeColor[i];
      }
    }
  }, [editMode]);

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
        totalNum={totalNum}
        hex={cardState.hex}
        lockIcon={cardState.isLock ? "lock" : "unlock"}
        favIcon={ifFav ? "fav" : "unfav"}
        styleFilter={styleFilter}
        handleDragReorder={handleDragReorder}
        delCard={delCard}
        lockCard={lockCard}
        favChanged={favChanged}
        refresh={refresh}
        setIsEditing={setIsEditing}
      />
      <div className={css.textRegion}>
        {
          !isEditing ?
          <>
            <div className={css.hexText}
              onClick={copyHex}
              style={styleFilter}
            >
              <Icon type="copy"
                style={{
                  filter: styleFilter,
                }}
              />
              {cardState.hex}
            </div>
            <div className={css.rgbText}
              style={styleFilter}
              onClick={copyHex}
            >
              <Icon type="copy"
                style={{
                  filter: styleFilter,
                }}
              />
              {`${editMode}(${modeColor.toString()})`}
            </div>
          </> : // Editing mode
          <>
            <input type="text" maxLength="7"
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
                        style={styleFilter}
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


// Other Components
const ToolBar = ({
  totalNum,
  hex,
  lockIcon,
  favIcon,
  styleFilter,
  delCard,
  lockCard,
  favChanged,
  refresh,
  setIsEditing,
  handleDragReorder,
}) => {
  const [opacity, cursor] = useMemo(() => {
    return totalNum === 2 ? ["0", "default"] : ["", "pointer"];
  }, [totalNum]);

  return (
    <div className={css.toolContainer}>
      <Icon type="close"
        style={{
          ...styleFilter,
          opacity,
          cursor,
        }}
        events={[["click", delCard]]}
      />
      <Icon type={lockIcon}
        style={styleFilter}
        events={[["click", lockCard]]}
      />
      <Icon type={favIcon}
        style={styleFilter}
        events={[["click", () => favChanged(hex)]]}
      />
      <Icon type="move"
        style={{
          ...styleFilter,
          cursor: "grab",
        }}
        events={[["mousedown", handleDragReorder]]}
      />
      <Icon type="refresh"
        style={styleFilter}
        events={[["click", refresh]]}
      />
      <Icon type="edit"
        style={styleFilter}
        events={[["click", () => setIsEditing((prev) => !prev)]]}
      />
    </div>
  );
};
