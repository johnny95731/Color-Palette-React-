import React from "react";
import {useReducer} from "react";
import Header from "./components/Header";

import styles from "./App.scss";
import Card from "./components/Card";
import {
  randRgbGen, rgb2gray, rgb2hsv, hsv2rgb, rgb2hsl, hsl2rgb,
  rgb2cmy, cmy2rgb,
} from "./utils/converter.js";
import {shuffle} from "./utils/algo.js";


const getModeInfos = (colorMode) => {
  switch (colorMode) {
    case 0: // rgb
      return {
        labels: ["Red", "Green", "Blue"],
        maxs: ["255", "255", "255"],
        converter: (x) => x,
        inverter: (x) => x,
      };
    case 1: // hsl
      return {
        labels: ["Hue", "Saturation", "Luminance"],
        maxs: ["359", "255", "255"],
        converter: rgb2hsl,
        inverter: hsl2rgb,
      };
    case 2: // hsb, hsv
      return {
        labels: ["Hue", "Saturation", "Brightness"],
        maxs: ["359", "255", "255"],
        converter: rgb2hsv,
        inverter: hsv2rgb,
      };
    case 3: // cmy
      return {
        labels: ["Cyam", "Magenta", "Yellow"],
        maxs: ["255", "255", "255"],
        converter: rgb2cmy,
        inverter: cmy2rgb,
      };
    default:
      throw Error(`Invalid colorMode: ${colorMode}`);
  }
};


const newCardState = (color) => {
  /**
   * Create a new state object.
   * @param {String} color Hex color.
   * @return {Object} State object.
   */
  return {
    color: randRgbGen(),
    isLock: false,
  };
};

const initialState = {
  mode: 0, // rgb
  infos: getModeInfos(0),
  insert: 0, // 0: rnadom, 1: RGB Mean,
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
        cards[action.idx] = newCardState();
      } else if (action.idx === "all") {
        cards.forEach((state) => {
          if (!state.isLock) state.color = randRgbGen();
        });
      }
      break;
    case "del":
      if (n === 1) return prevStates;
      cards.splice(action.idx, 1);
      break;
    case "add":
      if (n === 7) return prevStates;
      cards.splice(action.right, 0, newCardState());
      if (option.insert === 0) {
        let newColor;
        if (action.right === 0) {
          newColor = cards[action.right+1].color.map((val) => Math.round(val / 2));
        } else if (action.right > n) {
          newColor = cards[action.left].color.map((val) => Math.round((val + 255) / 2));
        } else {
          const leftColor = cards[action.left].color;
          newColor = cards[action.right+1].color.map(
              (val, i) => Math.round((val + leftColor[i]) / 2),
          );
        }
        cards[action.right].color = newColor;
      }
      break;
    case "edit":
      cards[action.idx].color = action.color;
      break;
    case "sort":
      switch (action.sortBy) {
        case "gray":
          cards.sort((a, b) => rgb2gray(a.color) - rgb2gray(b.color));
          break;
        case "random":
          shuffle(cards);
          break;
        case "invert":
          for (let i = 0; i < n / 2; i++) {
            [cards[i], cards[n-i]] = [cards[n-i], cards[i]];
          }
      }
      break;
    case "option":
      console.log(action);
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
  const [states, dispatch] = useReducer(reducer, initialState);

  const lockCard = (idx) => {
    dispatch({
      type: "lock", idx,
    });
  };
  const refresh = (idx) => {
    dispatch({
      type: "refresh", idx,
    });
  };
  const delCard = (idx) => {
    dispatch({
      type: "del", idx,
    });
  };
  const addCard = (left, right) => {
    dispatch({
      type: "add", left, right,
    });
  };
  const editCard = (idx, color) => {
    dispatch({
      type: "edit", idx, color,
    });
  };
  const sortCard = (sortBy) => {
    dispatch({
      type: "sort", sortBy,
    });
  };

  const optionChanged = (e, option, newOp) => {
    dispatch({
      type: "option", option, newOp,
    });
  };

  return (
    <>
      <Header
        refresh={() => refresh("all")}
        sortCard={sortCard}
        optionChanged={optionChanged}
      />
      <div className={styles.main}>
        {states.cards.map((state, i) => {
          return <Card
            key={i} cardId={i} totalNum={states.cards.length}
            color={state.color} isLock={state.isLock}
            lockCard={() => lockCard(i)}
            refresh={() => refresh(i)}
            delCard={() => delCard(i)}
            addCard={addCard}
            editCard={editCard}
            mode={states.mode}
            infos={states.infos}
          />;
        })}
      </div>
    </>
  );
};
export default App;
