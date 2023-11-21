import React, {useEffect} from "react";
import {useState, useCallback} from "react";

import {get, update} from "idb-keyval";
import {colorsDb} from "../utils/helpers.js";

const useFavPalettes = (favLoaded) => {
  const [favPlts, setFavPlt] = useState([]);

  useEffect(() => {
    const initFavPlts = async () => {
      const combs = await get("FavPlt", colorsDb);
      setFavPlt(combs);
      favLoaded.current[1] = true;
    };
    initFavPlts();
  }, []);

  const favPltChanged = useCallback(async (target) => {
    update("FavPlt", (prev) => {
      let newFav;
      if (prev.includes(target)) { // Favoriting => Non-Favoriting
        newFav = prev.filter((plt) => plt != target);
      } else { // Non-Favoriting => Favoriting
        newFav = [...prev];
        newFav.push(target);
      }
      setFavPlt(newFav);
      return newFav;
    }, colorsDb)
        .catch((e) => console.error(e));
  }, []);

  const ckeckIsFavPlt = useCallback((plt) => {
    return favPlts.includes(plt);
  }, [favPlts.length]);
  return [favPlts, favPltChanged, ckeckIsFavPlt];
};
export default useFavPalettes;
