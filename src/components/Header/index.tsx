import React, {useEffect, useMemo} from "react";
import Icon from "../Icons.tsx";
import css from "./index.scss";

import {Menu} from "../Menus/Menus.tsx";
// Redux-relate
import {useAppDispatch, useAppSelector} from "../../common/hooks/storeHooks.ts";
import {refreshCard, sortCards} from "../../features/slices/cardSlice.ts";
import {
  editModeChanged, mixingModeChanged,
} from "../../features/slices/optionsSlice.ts";
import {favPltsChanged} from "../../features/slices/favSlice.ts";
import {selectCard, selectFavorites} from "../../features/store.ts";
// types
import {MouseEventHandler} from "../../common/types/eventHandler.ts";
import {sortActionType} from "../../features/types/cardType.ts";
import {
  ColorSpacesList, ColorSpacesType, MixingModeList, MixingModeType,
} from "../../features/types/optionsType.ts";


// Other components
const RefreshAll = ({
  onClick: haldleClick,
}: {onClick: () => void}) => {
  return (
    <span className={css.btn} onClick={haldleClick}>
      <Icon type="refresh" />
      All
    </span>
  );
};

const Sort = ({
  handleSorting,
}: {
  handleSorting: (sortBy: sortActionType) => void
}) => {
  return (
    <Menu className={css.btn}
      iconType={"sort"}
      title="Sort"
      type="popup"
    >
      <div onClick={() => handleSorting("gray")}>Gray (g)</div>
      <div onClick={() => handleSorting("random")}>Random (r)</div>
      <div onClick={() => handleSorting("inversion")}>Invert</div>
    </Menu>
  );
};

const Mixing = ({
  optionChanged,
}: {
  optionChanged: (newMode: MixingModeType) => void
}) => {
  return (
    <Menu className={css.btn}
      iconType={"mixing"}
      title={"Mixing"}
    >
      {
        MixingModeList.map((val, i) => {
          return (
            <div key={`mode${i}`}
              onClick={() => optionChanged(val)}
            >
              {val}
            </div>
          );
        })
      }
    </Menu>
  );
};

const Edit = ({
  optionChanged,
}: {
  optionChanged: (newMode: ColorSpacesType) => void;
}) => {
  return (
    <Menu className={css.btn}
      iconType={"edit"}
      title={"Edit"}
    >
      {
        ColorSpacesList.map((val, i) => {
          return (
            <div key={`mode${i}`}
              onClick={() => optionChanged(val)}
            >
              {val.toUpperCase()}
            </div>
          );
        })
      }
    </Menu>
  );
};

const AddFavPlt = () => {
  // States / consts
  const cards = useAppSelector(selectCard).cards;
  const plt = cards.map((state) => state.hex.slice(1)).join("-");
  const favPltList = useAppSelector(selectFavorites).plts;
  const dispatch = useAppDispatch();

  const isFavPlt = useMemo(() => {
    return favPltList.includes(plt);
  }, [plt, favPltList.length]);

  // Events
  const removeFav = () => {
    dispatch(favPltsChanged({targetPlt: plt}));
  };

  const state = useMemo(() => {
    if (isFavPlt) {
      return {
        icon: "UnfavorPallete",
        text: "Del",
      };
    } else {
      return {
        icon: "FavorPallete",
        text: "Add",
      };
    }
  }, [isFavPlt]);
  return (
    <span className={`${css.btn} ${css.btnR}`}
      onClick={removeFav}
      style={{width: "55px"}}
    >
      <Icon type={state.icon} />
      {state.text}
    </span>
  );
};

const Bookmarks = ({onClick}: {onClick: MouseEventHandler}) => {
  return (
    <span className={`${css.btn} ${css.btnR}`}
      onClick={onClick}
    >
      <Icon type={"bookmark"} />
      Bookmarks
    </span>
  );
};

// const Setting = ({optionChanged}) => {
//   return (
//     <span className={`${css.btn} ${css.btnR}`}>
//       <Icon type={"gear"} />
//       Setting
//     </span>
//   );
// };


// Main component
const Header = ({
  favShowingChanged,
}: {
  favShowingChanged: MouseEventHandler;
}): React.JSX.Element => {
  const dispatch = useAppDispatch();
  const {
    refresh, handleSorting, handleMixingModeChanged, handleEditModeChanged,
  } = useMemo(() => {
    return {
      refresh: () => {
        dispatch(refreshCard({idx: -1}));
      },
      handleSorting: (sortBy: sortActionType) => {
        dispatch(sortCards({sortBy}));
      },
      handleMixingModeChanged: (newMode: MixingModeType) => {
        dispatch(mixingModeChanged({newMode}));
      },
      handleEditModeChanged: (newMode: ColorSpacesType) => {
        dispatch(editModeChanged({newMode}));
      },
    };
  }, []);

  // Connect refresh event to `space` button.
  useEffect(() => {
    const body = document.body;
    const keypressEvent = (e: KeyboardEvent) => {
      if (e.key === " ") refresh();
      else if (e.key.toLowerCase() === "g") {
        dispatch(sortCards({sortBy: "gray"}));
      } else if (e.key.toLowerCase() === "r") {
        dispatch(sortCards({sortBy: "random"}));
      }
    };
    body.addEventListener("keypress", keypressEvent);
    return () => body.removeEventListener("keypress", keypressEvent);
  }, []);

  return (
    <header className={css.header}>
      <h1 className={css.title}>
        Color Palette
      </h1>
      <div className={css.menubar}>
        {/* Left */}
        <RefreshAll onClick={refresh} />
        <Sort handleSorting={handleSorting} />
        <Mixing optionChanged={handleMixingModeChanged} />
        <Edit optionChanged={handleEditModeChanged} />
        {/* Right */}
        {/* <Setting /> */}
        <Bookmarks onClick={favShowingChanged} />
        <AddFavPlt />
      </div>
    </header>
  );
};
export default Header;
