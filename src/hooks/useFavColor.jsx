import React, {useEffect} from "react";
import {useState, useCallback} from "react";

import {get, update} from "idb-keyval";
import {colorsDb} from "../utils/helpers.js";

const sleep = (ms) => {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
};

const useFavColor = (favLoaded) => {
  const [favColors, setFavColors] = useState([]);

  useEffect(() => {
    const initFavColors = async () => {
      const colors = await get("FavColors", colorsDb);
      setFavColors(colors);
      favLoaded.current[0] = true;
    };
    initFavColors();
  }, []);

  const favColorChanged = useCallback((target) => {
    update("FavColors", (prev) => {
      let newFav;
      if (prev.includes(target)) { // Favoriting => Non-Favoriting
        newFav = prev.filter((hex) => hex != target);
      } else { // Non-Favoriting => Favoriting
        newFav = [...prev];
        newFav.push(target);
      }
      setFavColors(newFav);
      return newFav;
    }, colorsDb)
        .catch((e) => console.error(e));
  }, []);

  const ckeckIsFavColor = useCallback((hex) => {
    return favColors.includes(hex);
  }, [favColors.length]);

  // const appendColor = useCallback(async (newColor) => {
  //   update("FavColors", (prev) => {
  //     let newFav;
  //     if (prev) newFav = [...prev];
  //     else newFav = [];
  //     if (!newFav.includes(newColor)) {
  //       newFav.push(newColor);
  //     }
  //     setFavColors(newFav);
  //     return newFav;
  //   }, colorsDb);
  // }, []);

  // const delColor = useCallback(async (target) => {
  //   update("FavColors", (prev) => {
  //     const index = prev.indexOf(target);
  //     if (index > -1) {
  //       const newFav = prev.filter((hex) => hex != target);
  //       setFavColors(newFav);
  //       return newFav;
  //     } else {
  //       return prev;
  //     }
  //   }, colorsDb);
  // }, []);
  return [favColors, favColorChanged, ckeckIsFavColor];
};
export default useFavColor;
