import React, {
  useReducer, useRef, useState, useCallback, useMemo, useEffect,
} from "react";

import Header from "./components/Header";
import Card from "./components/Card";
import Icon from "./components/Icons.jsx";
import FavSidebar from "./components/FavColors";
import css from "./App.scss";
import useFavColor from "./hooks/useFavColor.jsx";
import useFavPlts from "./hooks/useFavPalettes.jsx";

import {
  randRgbGen, rgb2gray, rgb2hsv, hsv2rgb, rgb2hsl, hsl2rgb,
  rgb2cmy, cmy2rgb, rgb2hex,
} from "./utils/converter.js";
import {shuffle} from "./utils/helpers.js";

/**
 * Infomations be used in edit mode.
 * @param {String} colorMode color space.
 * @return {Object} {
 *   labels: labels for sliders,
 *   maxes: the maximums of sliders,
 *   converter: convert rbg to specified color space.
 *   inverter: convert specified color space to rbg space.
 * }
 */
const getModeInfos = (colorMode) => {
  switch (colorMode) {
    case "rgb":
      return {
        labels: ["Red", "Green", "Blue"],
        maxes: ["255", "255", "255"],
        converter: (x) => x,
        inverter: (x) => x,
      };
    case "hsl":
      return {
        labels: ["Hue", "Saturation", "Luminance"],
        maxes: ["359", "255", "255"],
        converter: rgb2hsl,
        inverter: hsl2rgb,
      };
    case "hsb": // hsb, hsv
      return {
        labels: ["Hue", "Saturation", "Brightness"],
        maxes: ["359", "255", "255"],
        converter: rgb2hsv,
        inverter: hsv2rgb,
      };
    case "cmy":
      return {
        labels: ["Cyam", "Magenta", "Yellow"],
        maxes: ["255", "255", "255"],
        converter: rgb2cmy,
        inverter: cmy2rgb,
      };
    default:
      throw Error(`Invalid colorMode: ${colorMode}`);
  }
};

const newCardState = () => {
  /**
   * Create a new state object.
   * @return {Object} State object.
   */
  const rgb = randRgbGen();
  return {
    color: rgb,
    hex: rgb2hex(rgb),
    isLock: false,
  };
};

const initialState = {
  mode: "rgb",
  infos: getModeInfos("rgb"), // getModeInfos(mode)
  insert: 0, // 0: rnadom, 1: RGB Mean,
  sort: "random",
  cards: Array.from({length: 5}, () => newCardState()),
};

const reducer = (prevStates, action) => {
  const {cards, ...options} = {...prevStates};
  const cardNum = cards.length;
  switch (action.type) {
    case "lock":
      cards[action.idx].isLock = !cards[action.idx].isLock;
      break;
    case "refresh":
      if ((typeof action.idx) === "number") {
        if (cards[action.idx].isLock) return prevStates;
        const cardState = newCardState();
        cards[action.idx] = cardState;
      } else if (action.idx === "all") {
        cards.forEach((state) => {
          if (!state.isLock) {
            state.color = randRgbGen();
            state.hex = rgb2hex(state.color);
          }
        });
      }
      options.sort = "random";
      break;
    case "del":
      if (cardNum === 2) return prevStates;
      cards.splice(action.idx, 1);
      options.sort = "random";
      break;
    case "add":
      if (cardNum === 8) return prevStates;
      else {
        const cardState = newCardState();
        const idx = action.idx;
        if (options.insert === 0) { // RGB Mean
          let newColor;
          if (idx === 0) {
            // Add to the first. Default to be the mean of first card and black.
            newColor = cards[idx].color.map((val) => Math.round(val / 2));
          } else if (idx === cardNum) {
            // Add to the last. Default to be the mean of last card and white.
            newColor = cards[idx - 1].color.map(
                (val) => Math.round((val + 255) / 2),
            );
          } else {
            // Color of cards at left side and at right side, respectively.
            // (before insert new card)
            const leftColor = cards[idx - 1].color;
            const rightColor = cards[idx].color;
            newColor = rightColor.map(
                (val, i) => Math.floor((val + leftColor[i]) / 2),
            );
          }
          cardState.color = newColor;
        }
        cardState.hex = rgb2hex(cardState.color);
        cards.splice(idx, 0, cardState);
        options.sort = "random";
      }
      break;
    case "edit":
      {
        const cardState = cards[action.idx];
        cardState.color = action.color;
        cardState.hex = rgb2hex(action.color);
      }
      options.sort = "random";
      break;
    case "sort":
      switch (action.sortBy) {
        case "gray":
          if (options.sort === "gray") {
            cards.sort((a, b) => rgb2gray(b.color) - rgb2gray(a.color));
            options.sort = "grayInv";
          } else {
            cards.sort((a, b) => rgb2gray(a.color) - rgb2gray(b.color));
            options.sort = "gray";
          }
          break;
        case "random":
          shuffle(cards);
          options.sort = action.sortBy;
          break;
        case "invert":
          for (let i = 0; i < cardNum / 2; i++) {
            [cards[i], cards[cardNum-i]] = [cards[cardNum-i], cards[i]];
          }
          options.sort = action.sortBy;
      }
      break;
    case "exchange":
      [cards[action.init], cards[action.final]] = [
        cards[action.final], cards[action.init],
      ];
      options.sort = "random";
      break;
    case "option":
      options[action.option] = action.newOp;
      if (action.option === "mode") {
        options.infos = getModeInfos(action.newOp);
      }
      break;
    default:
      throw new Error();
  }
  return {
    ...options, cards,
  };
};

const App = () => {
  const dbLoaded = useRef([false, false]); // Database is loaded.
  const [favColors, favColorChanged, ckeckIsFavColor] = useFavColor(dbLoaded);
  const [favPlts, favPltChanged, ckeckIsFavPlt] = useFavPlts(dbLoaded);

  const [states, dispatch] = useReducer(reducer, initialState);
  const [favShowing, setFavShowing] = useState(() => false);
  const plt = states.cards.map((state) => state.hex.slice(1)).join("-");
  const cardsIsFav = useMemo(() => {
    const cards = states.cards;
    const newIsFav = new Array(cards.length);
    for (let i = 0; i < cards.length; i++) {
      newIsFav[i] = ckeckIsFavColor(cards[i].hex);
    }
    return newIsFav;
  }, [favColors.length, plt]);
  const isFavPlt = useMemo(() => ckeckIsFavPlt(plt), [plt, favPlts.length]);

  const refresh = useCallback((idx) => {
    dispatch({
      type: "refresh", idx,
    });
  }, []);
  const sortCard = useCallback((sortBy) => {
    dispatch({
      type: "sort", sortBy,
    });
  }, []);
  const optionChanged = useCallback((option, newOp) => {
    dispatch({
      type: "option", option, newOp,
    });
  }, []);

  const favShowingChanged = useCallback(() => {
    setFavShowing((prev) => !prev);
  }, []);

  const favoritingPlt = () => {
    favPltChanged(plt);
  };

  return (
    <>
      <Header
        refresh={() => refresh("all")}
        sortCard={sortCard}
        optionChanged={optionChanged}
        favoritingPlt={favoritingPlt}
        isFavPlt={isFavPlt}
        favShowingChanged={favShowingChanged}
      />
      <Cards
        dispatch={dispatch}
        states={states}
        cardsIsFav={cardsIsFav}
        favColorChanged={favColorChanged}
      />
      <FavSidebar
        favColors={favColors}
        favPlts={favPlts}
        delColor={favColorChanged}
        delPlt={favPltChanged}
        isShowing={favShowing}
        favShowingChanged={favShowingChanged}
      />
    </>
  );
};
export default App;

// Main region
const Cards = ({
  dispatch,
  states,
  cardsIsFav,
  favColorChanged,
}) => {
  // States / consts
  const cardRefs = useRef({});
  const totalNum = states.cards.length;
  const viewportWidth = window.innerWidth;
  const [dir, totalLength, clientPos] = useMemo(() => {
    const body = document.body;
    if (viewportWidth > 900) { // Horizontal flow.
      return ["left", body.clientWidth, "clientX"];
    } else { // Vertical flow.
      return ["top", body.clientHeight, "clientY"];
    }
  }, [viewportWidth]);

  const cardsPos = useMemo(() => {
    // Get card.getBoundingClientRect()[dir] for each card.
    const step = totalLength / totalNum;
    return Array.from({length: totalNum}, (_, i) => Math.floor(i * step));
  }, [totalNum, totalLength]);

  // Events
  const lockCard = useCallback((idx) => {
    dispatch({
      type: "lock", idx,
    });
  }, []);
  const refresh = useCallback((idx) => {
    dispatch({
      type: "refresh", idx,
    });
  }, []);
  const delCard = useCallback((idx) => {
    dispatch({
      type: "del", idx,
    });
  }, []);
  const editCard = useCallback((idx, color) => {
    dispatch({
      type: "edit", idx, color,
    });
  }, []);
  const exchange = useCallback((init, final) => {
    dispatch({
      type: "exchange", init, final,
    });
  }, []);

  /**
   * The event is triggered when you are dragging the <-> icon.
   */
  const handleDragReorder = useCallback((e, cardId) => {
    const initPos = e[clientPos]; // Cursor position when mouse down.
    cardRefs.current.dragging = cardId;
    const card = cardRefs.current[cardId];
    card.classList.add(css.dragging);
    card.style[dir] = `${initPos - cardsPos[cardId]}px`;
  }, [totalNum]);

  const handleMouseMove = useCallback((e) => {
    const prevIdx = cardRefs.current.dragging;
    if (prevIdx == null) return;
    const nowPos = e[clientPos];
    const card = cardRefs.current[prevIdx];
    const cardLength = totalLength / totalNum;
    card.style[dir] = `${nowPos - cardsPos[prevIdx]}px`;
    // Index of card that cursor at.
    const nowIdx = Math.floor(nowPos / cardLength);
    if (prevIdx !== nowIdx) {
      card.style[dir] = "";
      card.classList.remove(css.dragging);
      cardRefs.current.dragging = nowIdx;
      cardRefs.current[nowIdx].classList.add(css.dragging);
      cardRefs.current[nowIdx].style[dir] = `${nowPos - cardsPos[nowIdx]}px`;
      exchange(prevIdx, nowIdx);
    }
  }, [totalNum, viewportWidth]);

  const handleMouseUp = useCallback(() => {
    const nowIdx = cardRefs.current.dragging;
    if (nowIdx == null) return;
    const card = cardRefs.current[nowIdx];
    // Reset card position
    card.style[dir] = "";
    card.classList.remove(css.dragging);
    cardRefs.current.dragging = null;
  }, [viewportWidth]);

  useEffect(() => {
    const body = document.body;
    body.addEventListener("mousemove", handleMouseMove);
    body.addEventListener("mouseup", handleMouseUp);
    return () => {
      body.removeEventListener("mousemove", handleMouseMove);
      body.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  return (
    <div className={css.main}>
      {states.cards.map((state, i) => {
        return <Card key={`card${i}`}
          ref={(el) => cardRefs.current[i] = el}
          cardId={i}
          totalNum={states.cards.length}
          color={state.color} isLock={state.isLock}
          cardState={state}
          ifFav={cardsIsFav[i]}
          delCard={() => delCard(i)}
          lockCard={() => lockCard(i)}
          favChanged={() => favColorChanged(states.cards[i].hex)}
          refresh={() => refresh(i)}
          handleDragReorder={(e) => handleDragReorder(e, i)}
          editCard={editCard}
          editMode={states.mode}
          infos={states.infos}
        />;
      })}
      <InsertRegions
        totalNum={states.cards.length}
        dispatch={dispatch}
      />
    </div>
  );
};

const InsertRegions = ({
  totalNum, // total num of cards.
  dispatch,
}) => {
  // States / consts
  const viewportWidth = window.innerWidth;

  const positions = useMemo(() => {
    const step = 100 / totalNum;
    const dir = viewportWidth > 900 ? "left" : "top";

    return Array.from({length: totalNum + 1}, (_, i) => {
      const style = {};
      style[dir] = `${i * step}%`;
      return style;
    });
  }, [totalNum, viewportWidth]);

  // Events
  const addCard = useCallback((idx) => {
    dispatch({
      type: "add", idx,
    });
  }, []);

  return (
    Array.from({length: totalNum + 1}, (_, i) => {
      return (
        <div className={css.insertContainer}
          key={`insert${i}`}
          style={positions[i]}
        >
          <div
            onClick={() => addCard(i)}
          >
            <Icon type={"insertRight"}
            />
          </div>
        </div>
      );
    })
  );
};
