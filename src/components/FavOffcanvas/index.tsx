import React, {useState, useMemo} from "react";
import Icon from "../Customs/Icons.tsx";
import css from "./index.scss";
// utils
import {rgb2gray, hex2rgb, isValidHex} from "@/common/utils/colors.ts";
import {copyHex} from "@/common/utils/helpers.ts";
// Stores
import {selectPlt, selectFavorites} from "@/features";
import {useAppDispatch, useAppSelector} from "@/features";
import {setPlt} from "@/features/slices/pltSlice.ts";
import {favColorsChanged, favPltsChanged} from "slices/favSlice.ts";

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
      <span className={css.delWrapper}>
        <Icon type="del" onClick={removeFav} />
      </span>
    </li>
  );
};

const PaletteBlock = ({
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
  const applyingPlt = () => {
    for (const hex of colors) {
      if (!isValidHex(hex)) return;
    }
    dispatch(setPlt(colors));
  };

  return (
    <li className={css.paletteBlock}>
      <div style={{background: `linear-gradient(90deg, ${bgGrad})`}} >
        <div className={css.caretWrapper} >
          <Icon type="caret" onClick={applyingPlt} />
        </div>
        <span className={css.delWrapper}>
          <Icon type="del" onClick={removeFav} />
        </span>
      </div>
      <div onClick={copyHex}>{plt}</div>
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
  const {cards} = useAppSelector(selectPlt);
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
    <div className={css.appendPlt}
      onClick={removeFav}
    >
      <Icon type={state.icon} />
      {state.text}
    </div>
  );
};

// Main component
const pageLabels: string[] = ["Colors", "Palettes"];
const FavOffcanvas = ({
  isShowing,
  showingChanged,
}: {
  isShowing: boolean;
  showingChanged: () => void;
}) => {
  // States / consts
  const favoritesState = useAppSelector(selectFavorites);
  const [page, setPage] = useState<number>(() => 0);

  return (
    <div className={css.favOffcanvas}
      style={{
        transform: isShowing ? "translateX(-100%)" : "",
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
        <Icon type="close" onClick={showingChanged} />
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
              <PaletteBlock key={`favPlt ${plt}`} plt={plt} />
            );
          })
        }
      </ul>
      <AddFavPlt changePage={() => setPage(1)}/>
    </div>
  );
};
FavOffcanvas.displayName = "FavOffcanvas";
export default FavOffcanvas;
