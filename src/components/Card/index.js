import React, {
  Fragment, useState, useMemo, useEffect, useCallback} from "react";
import Icon from "../Icons.jsx";
import css from "./index.scss";

import {rgb2gray, rgb2hex, hex2rgb, isValidHex} from "../../utils/converter.js";
import {hexTextEdited, copyHex} from "../../utils/helpers.js";

// Main component
const Card = ({
  cardId,
  totalNum,
  cardState,
  ifFav,
  delCard,
  lockCard,
  favChanged,
  refresh,
  addCard,
  editCard,
  editMode,
  infos: {labels, maxes, converter, inverter},
}) => {
  // States
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

  const iconFilter = useMemo(() => {
    return {filter: isLight ? undefined : "invert(1)"};
  }, [isLight]);

  const insertDisplay = useMemo(() => {
    return totalNum === 8 ? "none" : undefined;
  }, [totalNum]);


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

  const handleInsertClick = (side) => {
    if (side === "Left") addCard(cardId-1, cardId);
    else addCard(cardId, cardId+1);
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
        transition: "background-color .5s ease",
      }}
    >
      <SideCard side="Left"
        style={{
          ...iconFilter,
          display: insertDisplay,
        }}
        onClick={handleInsertClick}
      />
      <div className={css.centerCard}>
        <ToolBar
          totalNum={totalNum}
          hex={cardState.hex}
          lockIcon={cardState.isLock ? "lock" : "unlock"}
          favIcon={ifFav ? "fav" : "unfav"}
          iconFilter={iconFilter}
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
                style={iconFilter}
              >
                <Icon type="copy"
                  style={{
                    filter: iconFilter,
                  }}
                />
                {cardState.hex}
              </div>
              <div className={css.rgbText}
                style={iconFilter}
                onClick={copyHex}
              >
                <Icon type="copy"
                  style={{
                    filter: iconFilter,
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
                          style={iconFilter}
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
      <SideCard side="Right"
        style={{
          ...iconFilter,
          display: insertDisplay,
        }}
        onClick={handleInsertClick}
      />
    </div>
  );
};
export default Card;


// Other Components
const SideCard = ({side, style, onClick}) => {
  return (
    <div className={css.sideCard}>
      <Icon type={`insert${side}`}
        className={`${side === "Right" ? css.insertRight : css.insertLeft}`}
        // style={style}
        events={[["click", () => onClick(side)]]}
      />
    </div>
  );
};

const ToolBar = ({
  totalNum,
  hex,
  lockIcon,
  favIcon,
  iconFilter,
  delCard,
  lockCard,
  favChanged,
  refresh,
  setIsEditing,
}) => {
  return (
    <div className={css.toolContainer}>
      <Icon type="close"
        style={{
          ...iconFilter,
          opacity: totalNum === 2 && 0,
          cursor: totalNum === 2 ? "default" : "pointer",
        }}
        events={[["click", delCard]]}
      />
      <Icon type={lockIcon}
        style={iconFilter}
        events={[["click", lockCard]]}
      />
      <Icon type={favIcon}
        style={iconFilter}
        events={[["click", () => favChanged(hex)]]}
      />
      <Icon type="refresh"
        style={iconFilter}
        events={[["click", refresh]]}
      />
      <Icon type="edit"
        style={iconFilter}
        events={[["click", () => setIsEditing((prev) => !prev)]]}
      />
    </div>
  );
};
