import React, {useMemo} from "react";
import Icon from "../Icons.tsx";
import css from "./index.scss";

import {Menu} from "../Menus/Menus.tsx";
// Redux-relate
import {useAppDispatch, useAppSelector} from "../../common/hooks/storeHooks.ts";
import {
  editModeChanged, mixingModeChanged,
} from "../../features/slices/optionsSlice.ts";
import {favPltsChanged} from "../../features/slices/favSlice.ts";
import {selectCard, selectFavorites} from "../../features/store.ts";
// types
import {MouseEventHandler} from "../../common/types/eventHandler.ts";
import {SortActionType} from "../../features/types/cardType.ts";
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
  handleSorting: (sortBy: SortActionType) => void
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
  refresh,
  handleSorting,
  favShowingChanged,
}: {
  refresh: () => void;
  handleSorting: (sortBy: SortActionType) => void;
  favShowingChanged: MouseEventHandler;
}): React.JSX.Element => {
  const dispatch = useAppDispatch();
  const {
    handleMixingModeChanged, handleEditModeChanged,
  } = useMemo(() => {
    return {
      handleMixingModeChanged: (newMode: MixingModeType) => {
        dispatch(mixingModeChanged({newMode}));
      },
      handleEditModeChanged: (newMode: ColorSpacesType) => {
        dispatch(editModeChanged({newMode}));
      },
    };
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
