import React, {Fragment, useState, useMemo, useEffect} from "react";
import styles from "./index.scss";
import tooltipStyles from "../tooltip.scss";
const {tooltip, topTip} = tooltipStyles;

import {rgb2gray, rgb2hex, hex2rgb, isValidHex} from "../../utils/converter.js";
import Close from "../../images/x-lg.svg?url";
import Lock from "../../images/lock-fill.svg?url";
import Unlock from "../../images/unlock-fill.svg?url";
import Refresh from "../../images/arrow-clockwise.svg?url";
import Pen from "../../images/pen-fill.svg?url";
import insertRight from "../../images/arrow-bar-left.svg?url";
import insertLeft from "../../images/arrow-bar-right.svg?url";


// Other components
const CloseTool = ({totalNum, isLight, onClick}) => {
  return (
    <img src={Close}
      onClick={onClick}
      style={{
        filter: isLight ? "" : "invert(1)",
        opacity: totalNum === 2 ? 0 : "",
        cursor: totalNum === 2 ? "default" : "",
      }}
    />
  );
};

const LockTool = ({isLight, isLock, onClick}) => {
  return (
    <img src={isLock ? Lock : Unlock}
      onClick={onClick}
      style={{
        filter: isLight ? "" : "invert(1)",
      }}
    />
  );
};

const RefreshTool = ({isLight, isLock, onClick}) => {
  return <img src={Refresh}
    onClick={onClick}
    style={{
      cursor: isLock ? "not-allowed" : "pointer",
      filter: isLight ? "" : "invert(1)",
    }}
  />;
};

const EditBtn = ({isLight, onClick}) => {
  return <img src={Pen}
    onClick={onClick}
    style={{
      filter: isLight ? "" : "invert(1)",
    }}
  />;
};

const InsertIcon = ({side, isLight, onClick}) => {
  const url = side==="right" ? insertRight : insertLeft;
  return (
    <div className={styles.sideCard}>
      <img src={url}
        className={`${styles.insertBtn} ${side==="right" ? styles.insertBtnR : ""}`}
        style={{
          filter: isLight ? "" : "invert(1)",
        }}
        onClick={() => onClick(side)}
      />
    </div>
  );
};


// Main component
const Card = ({
  cardId,
  totalNum,
  color, // in RGB space
  isLock,
  lockCard,
  refresh,
  delCard,
  addCard,
  editCard,
  mode,
  infos: {labels, maxs, converter, inverter},
}) => {
  // States
  const [isEditing, setIsEditing] = useState(() => false);

  const {
    pageHex,
    isLight,
    modeColor,
  } = useMemo(() => {
    return {
      pageHex: rgb2hex(color),
      isLight: rgb2gray(color) > 127,
      modeColor: converter(color),
    };
  }, [color[0], color[1], color[2], mode]);

  // Events
  const hendleTextClick = (e) => {
    // Copy text to clipboard
    const target = e.target || e.srcElement;
    const text = target.innerText;
    const idx = text.indexOf("\n");
    navigator.clipboard.writeText(
        text.slice(text.startsWith("#") ? 1 : 0, idx),
    );
    target.lastChild.innerText = "Copied.";
  };

  const hendleTip = (e, type) => {
    const target = (e.target || e.srcElement).lastChild;
    target.innerText = target.dataset.tip;
  };

  const handleHexEdit = (e) => {
    const textInput = (e.target || e.srcElement);
    let text = (textInput.value).toUpperCase();
    text = text.replace(/[^a-f0-9]+$/ig, "");
    if (!text.startsWith("#")) text = "#" + text;
    textInput.value = text;
  };

  const handleHexBlur = (e) => {
    const textInput = (e.target || e.srcElement);
    const text = (textInput.value).toUpperCase();
    if (isValidHex(text)) {
      editCard(cardId, hex2rgb(text));
    }
  };

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
    if (side === "left") addCard(cardId-1, cardId);
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
  }, [mode]);

  return (
    <div
      className={styles.cardContainer}
      style={{
        backgroundColor: pageHex,
        color: isLight ? "#000" : "#fff",
        // maxWidth: `${Math.floor(100/totalNum)}%`
      }}
    >
      <InsertIcon side="left"
        isLight={isLight} onClick={handleInsertClick}
      />
      <div className={styles.toolContainer}>
        <CloseTool totalNum={totalNum} isLight={isLight} onClick={delCard} />
        <LockTool isLight={isLight} isLock={isLock} onClick={lockCard} />
        <RefreshTool isLight={isLight} isLock={isLock} onClick={refresh}/>
        <EditBtn
          isLight={isLight}
          onClick={() => setIsEditing((prev) => !prev)}
        />
        <div className={styles.regulator}>
          {
            !isEditing ?
            <>
              <div
                className={`${styles.hexText} ${tooltip}`}
                onClick={hendleTextClick}
                onMouseEnter={hendleTip}
              >
                {pageHex}
                <span className={topTip} data-tip="Copy to clipboard." />
              </div>
              <div
                className={`${styles.rgbText} ${tooltip}`}
                onClick={hendleTextClick}
                onMouseEnter={hendleTip}
              >
                rgb({color.toString()})
                <span className={topTip} data-tip="Copy to clipboard." />
              </div>
            </> : // Editing mode
            <>
              <input type="text" maxLength="7"
                defaultValue={pageHex}
                id={`card${cardId}-hex`}
                className={`${styles.hexText} ${styles.hexInput}`}
                onChange={handleHexEdit}
                onBlur={handleHexBlur}
              />
              {
                labels.map((label, i) => {
                  return (
                    <Fragment key={`card${cardId}-frag${i}`}>
                      <span key={`card${cardId}-label${i}`}>
                        {label}: {modeColor[i]}
                      </span>
                      <input key={`card${cardId}-slider${i}`}
                        id={`card${cardId}-slider${i}`}
                        type="range" min="0" max={maxs[i]}
                        defaultValue={modeColor[i]}
                        className={styles.slider}
                        onChange={(e) => handleSliderChange(e, i)}
                      />
                    </Fragment>
                  );
                })
              }
            </>
          }
        </div>
      </div>
      <InsertIcon side="right"
        isLight={isLight} onClick={handleInsertClick}
      />
    </div>
  );
};
export default Card;
