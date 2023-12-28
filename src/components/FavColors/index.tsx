import React, {useState, useMemo} from "react";
import Icon from "../Icons.tsx";
import css from "./index.scss";
// utils
import {rgb2gray, hex2rgb} from "../../common/utils/converter.ts";
import {copyHex} from "../../common/utils/helpers.ts";
// Redux-relate
import {useAppDispatch, useAppSelector} from "../../common/hooks/storeHooks.ts";
import {
  favColorsChanged, favPltsChanged,
} from "../../features/slices/favSlice.ts";
import {selectFavorites} from "../../features/store.ts";
// types
import {MouseEventHandler} from "../../common/types/eventHandler.ts";


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
        color: isLight ? "black" : "white",
        // border: `1px solid ${isLight ? "#0008" : "#fff8"}`,
      }}
    >
      <div onClick={copyHex}>
        <Icon type="copy"
          style={{
            filter: isLight ? "none" : "invert(1)",
          }}
        />
        {hex}
      </div>
      <span className={css.delRegion}>
        <Icon type="del" events={[["click", removeFav]]} />
      </span>
    </li>
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
          events={[["click", removeFav]]}
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
  favShowingChanged: MouseEventHandler,
}) => {
  // States / consts
  const favoritesState = useAppSelector(selectFavorites);
  const [page, setPage] = useState<number>(() => 0);

  return isShowing ? (
    <>
      <div className={css.blank}
        onClick={favShowingChanged}
      />
      <div className={css.favColors}>
        <nav className={css.menuBar}>
          {
            pageLabels.map((label, i) => {
              return (
                <span key={`page ${label}`}
                  style={{
                    textDecoration: i === page ? "underline solid 2px" : "none",
                    backgroundColor: i === page ? "#fff" : undefined,
                  }}
                  onClick={() => setPage(i)}
                >
                  {label}
                </span>
              );
            })
          }
          <Icon type="close" events={[["click", favShowingChanged]]}
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
      </div>
    </>
  ) : "";
};
export default FavSidebar;
