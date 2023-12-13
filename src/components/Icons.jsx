import React, {useRef, useEffect, useMemo, useCallback} from "react";
import "./icons.scss";

import CloseUrl from "../images/x-lg.svg?url";
import DelUrl from "../images/trash3-fill.svg?url";
import LockUrl from "../images/lock-fill.svg?url";
import UnlockUrl from "../images/unlock-fill.svg?url";
import FavUrl from "../images/star-fill.svg?url";
import UnfavUrl from "../images/star.svg?url";
import DrapUrl from "../images/arrows.svg?url";
import RefreshUrl from "../images/arrow-clockwise.svg?url";
import SliderUrl from "../images/sliders.svg?url";
import CopyUrl from "../images/copy.svg?url";
import SortUrl from "../images/sort-down.svg?url";
import InsertUrl from "../images/file-earmark-plus.svg?url";
import AppendtUrl from "../images/arrows-expand-vertical.svg?url";
import FavPalleteUrl from "../images/bookmark-plus.svg?url";
import UnfavPalleteUrl from "../images/bookmark-dash.svg?url";
import BookmarkUrl from "../images/bookmarks.svg?url";
import GearUrl from "../images/gear.svg?url";


const urls = {
  close: CloseUrl,
  del: DelUrl,
  lock: LockUrl,
  unlock: UnlockUrl,
  fav: FavUrl,
  unfav: UnfavUrl,
  move: DrapUrl,
  refresh: RefreshUrl,
  edit: SliderUrl,
  copy: CopyUrl,
  sort: SortUrl,
  insert: InsertUrl,
  insertRight: AppendtUrl,
  insertLeft: AppendtUrl,
  FavorPallete: FavPalleteUrl,
  UnfavorPallete: UnfavPalleteUrl,
  bookmark: BookmarkUrl,
  gear: GearUrl,
};

const Icon = ({
  type,
  className,
  style,
  events = [],
}) => {
  const imgRef = useRef();
  const _className = useMemo(() => (
    `icon ${typeof className === "string" ? className : ""}`
  ), [className]);

  // Connect events
  useEffect(() => {
    const element = imgRef.current;
    events.forEach((ev) => {
      element.addEventListener(...ev);
    });
    return () => {
      events.forEach((ev, i) => {
        element.removeEventListener(...ev);
      });
    };
  }, []);

  return (
    <img src={urls[type]} alt={type} ref={imgRef}
      className={_className}
      style={style}
      draggable="false"
    />
  );
};
export default Icon;
