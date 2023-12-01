import React, {
  useReducer, useRef, useState, useCallback, useEffect, useMemo,
} from "react";

import Header from "./components/Header";
import Card from "./components/Card";
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
  const {cards, ...option} = {...prevStates};
  const n = cards.length - 1;
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
      option.sort = "random";
      break;
    case "del":
      if (n === 1) return prevStates;
      cards.splice(action.idx, 1);
      break;
    case "add":
      if (n === 7) return prevStates;
      else {
        const cardState = newCardState();
        if (option.insert === 0) { // RGB Mean
          let newColor;
          if (action.right === 0) {
            cardState.color = cards[action.right].color.map(
                (val) => Math.round(val / 2));
          } else if (action.right > n) {
            cardState.color = cards[action.left].color.map(
                (val) => Math.round((val + 255) / 2),
            );
          } else {
            const leftColor = cards[action.left].color;
            const rightColor = cards[action.right].color;
            newColor = rightColor.map(
                (val, i) => Math.round((val + leftColor[i]) / 2),
            );
          }
          cardState.color = newColor;
        }
        cardState.hex = rgb2hex(cardState.color);
        cards.splice(action.right, 0, cardState);
      }
      break;
    case "edit":
      {
        const cardState = cards[action.idx];
        cardState.color = action.color;
        cardState.hex = rgb2hex(action.color);
      }
      break;
    case "sort":
      switch (action.sortBy) {
        case "gray":
          if (option.sort === "gray") {
            cards.sort((a, b) => rgb2gray(b.color) - rgb2gray(a.color));
            option.sort = "grayInv";
          } else {
            cards.sort((a, b) => rgb2gray(a.color) - rgb2gray(b.color));
            option.sort = "gray";
          }
          break;
        case "random":
          shuffle(cards);
          option.sort = action.sortBy;
          break;
        case "invert":
          for (let i = 0; i < n / 2; i++) {
            [cards[i], cards[n-i]] = [cards[n-i], cards[i]];
          }
          option.sort = action.sortBy;
      }
      break;
    case "option":
      option[action.option] = action.newOp;
      if (action.option === "mode") {
        option.infos = getModeInfos(action.newOp);
      }
      break;
    default:
      throw new Error();
  }
  return {
    ...option, cards,
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
  /**
   * Add a card between `left` and `right`.
   * @param {Number} left Index of left card.
   * @param {Number} right Index of right card.
   */
  const addCard = useCallback((left, right) => {
    dispatch({
      type: "add", left, right,
    });
  }, []);
  const editCard = useCallback((idx, color) => {
    dispatch({
      type: "edit", idx, color,
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
      <div className={css.main}>
        {states.cards.map((state, i) => {
          return <Card
            key={`card${i}`} cardId={i} totalNum={states.cards.length}
            color={state.color} isLock={state.isLock}
            cardState={state}
            ifFav={cardsIsFav[i]}
            delCard={() => delCard(i)}
            lockCard={() => lockCard(i)}
            favChanged={() => favColorChanged(states.cards[i].hex)}
            refresh={() => refresh(i)}
            addCard={addCard}
            editCard={editCard}
            editMode={states.mode}
            infos={states.infos}
          />;
        })}
      </div>
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
