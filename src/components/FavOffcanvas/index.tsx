import React, {useState, useMemo} from "react";
import Icon from "../Icons.tsx";
import css from "./index.scss";
// utils
import {rgb2gray, hex2rgb} from "../../common/utils/converter.ts";
import {copyHex} from "../../common/utils/helpers.ts";
// Redux / Context
import {useAppDispatch, useAppSelector} from "../../common/hooks/storeHooks.ts";
import {
  favColorsChanged, favPltsChanged,
} from "../../features/slices/favSlice.ts";
import {selectCard, selectFavorites} from "../../features/store.ts";
// types
import {MouseHandler} from "../../common/types/eventHandler.ts";

// Other Components
const ColorBlock = ({
  hex,
}: {
  hex: string;
}) => {
  // States / consts
  const rgb = hex2rgb(hex);
  if (!rgb) return;
  const isLight = useMemo(() => rgb2gray(rgb) > 127, [hex]);
  const dispatch = useAppDispatch();

  // Events
  const removeFav = () => {
    dispatch(favColorsChanged(hex));
  };
  return (
    <li className={css.colorBlock}
      style={{
        backgroundColor: hex,
        color: isLight ? "#000" : "#fff",
      }}
    >
      <div onClick={copyHex}>
        <Icon type="copy"
          style={{
            filter: isLight ? "" : "invert(1)",
          }}
        />
        {hex}
      </div>
      <span className={css.delRegion}>
        <Icon type="del" onClick={removeFav} />
      </span>
    </li>
  );
};

const AddFavPlt = ({
  changePage,
}: {
  /**
   * setPage(1)
   */
  changePage: () => void;
}) => {
  // States / consts
  const cards = useAppSelector(selectCard).cards;
  const plt = cards.map((state) => state.hex.slice(1)).join("-");
  const favPltList = useAppSelector(selectFavorites).plts;
  const isFavPlt = favPltList.includes(plt);
  const dispatch = useAppDispatch();

  // Events
  const removeFav = () => {
    dispatch(favPltsChanged(plt));
    changePage();
  };

  const state = useMemo(() => {
    if (isFavPlt) {
      return {
        icon: "unfavorPallete",
        text: "Remove Pallete",
      } as const;
    } else {
      return {
        icon: "favorPallete",
        text: "Append Pallete",
      } as const;
    }
  }, [isFavPlt]);
  return (
    <span className={css.appendPlt}
      onClick={removeFav}
    >
      <Icon type={state.icon} />
      {state.text}
    </span>
  );
};

const PalleteBlock = ({
  plt,
}: {
  plt: string;
}) => {
  const colors = plt.split("-").map((hex) => `#${hex}`);
  const diff = useMemo(() => {
    // Round to 2nd decimal place. Reprecent in percentage.
    return Math.round(10000 / colors.length) / 100;
  }, [colors.length]);
  const bgGrad = useMemo(() => {
    const midPoint = colors.map((hex, i) => {
      return `${hex} ${i * diff}%,${hex} ${(i+1) * diff}%`;
    }).join();
    return midPoint;
  }, [plt]);
  const dispatch = useAppDispatch();

  // Events
  const removeFav = () => {
    dispatch(favPltsChanged(plt));
  };
  return (
    <li className={css.palleteBlock}>
      <div style={{background: `linear-gradient(90deg, ${bgGrad})`}} />
      <span className={css.delRegion}>
        <Icon type="del"
          onClick={removeFav}
        />
      </span>
      <div onClick={copyHex}>{plt}</div>
    </li>
  );
};

// Main component
const pageLabels: string[] = ["Colors", "Palettes"];
const FavSidebar = ({
  isShowing,
  favShowingChanged,
}: {
  isShowing: boolean;
  favShowingChanged: MouseHandler,
}) => {
  // States / consts
  const favoritesState = useAppSelector(selectFavorites);
  const [page, setPage] = useState<number>(() => 0);

  return (
    <div id={css.favContainer}
      style={{
        left: isShowing ? "auto" : "100%",
        right: isShowing ? "0" : "auto",
      }}
    >
      <div className={css.blank}
        onClick={favShowingChanged}
        style={{
          display: isShowing ? undefined : "none",
        }}
      />
      <div className={css.favOffcanvas}
        style={{
          right: isShowing ? undefined : `-${css.favOffcanvasWidth}`,
        }}
      >
        <nav className={css.menuBar}>
          {
            pageLabels.map((label, i) => {
              return (
                <span key={`page ${label}`}
                  className={i === page ? css.focusButton : undefined}
                  onClick={() => setPage(i)}
                >
                  {label}
                </span>
              );
            })
          }
          <Icon type="close"
            onClick={favShowingChanged as (e:React.MouseEvent) => void}
          />
        </nav>
        {/* Page content */}
        <ul className={css.pageContent}>
          {page === 0 ?
            favoritesState.colors.map((hex) => {
              return (
                <ColorBlock key={`favColor ${hex}`} hex={hex} />
              );
            }) :
            favoritesState.plts.map((plt) => {
              return (
                <PalleteBlock key={`favPlt ${plt}`} plt={plt} />
              );
            })
          }
        </ul>
        <AddFavPlt changePage={() => setPage(1)}/>
      </div>
    </div>
  );
};
export default FavSidebar;
