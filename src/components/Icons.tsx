import React, {useMemo} from "react";
import "./icons.scss";

import CloseUrl from "../../res/img/x-lg.svg?url";
import DelUrl from "../../res/img/trash3-fill.svg?url";
import LockUrl from "../../res/img/lock-fill.svg?url";
import UnlockUrl from "../../res/img/unlock-fill.svg?url";
import FavUrl from "../../res/img/star-fill.svg?url";
import UnfavUrl from "../../res/img/star.svg?url";
import DrapUrl from "../../res/img/arrows.svg?url";
import RefreshUrl from "../../res/img/arrow-clockwise.svg?url";
import SliderUrl from "../../res/img/sliders.svg?url";
import CopyUrl from "../../res/img/copy.svg?url";
import SortUrl from "../../res/img/sort-down.svg?url";
import InsertUrl from "../../res/img/file-earmark-plus.svg?url";
import AppendtUrl from "../../res/img/arrows-expand-vertical.svg?url";
import FavPalleteUrl from "../../res/img/bookmark-plus.svg?url";
import UnfavPalleteUrl from "../../res/img/bookmark-dash.svg?url";
import BookmarkUrl from "../../res/img/bookmarks.svg?url";
import ListUrl from "../../res/img/list.svg?url";
import caretUrl from "../../res/img/caret-left-fill.svg?url";
import {MouseHandler, TouchHandler} from "../common/types/eventHandler";


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
  blend: InsertUrl,
  insert: AppendtUrl,
  favorPallete: FavPalleteUrl,
  unfavorPallete: UnfavPalleteUrl,
  bookmark: BookmarkUrl,
  list: ListUrl,
  caret: caretUrl,
} as const;

export type iconType = keyof typeof urls;


const Icon = ({
  type,
  className,
  style,
  onClick,
  onMouseDown,
  onTouchStart,
}: {
  type: iconType;
  className?: string;
  style?: object;
  onClick?: MouseHandler | undefined;
  onMouseDown?: MouseHandler | undefined;
  onTouchStart?: TouchHandler | undefined;
}) => {
  const _className = useMemo(() => (
    `icon ${typeof className === "string" ? className : ""}`
  ), [className]);

  return (
    <img src={urls[type]} alt={type}
      className={_className}
      style={style}
      draggable="false"
      onClick={onClick}
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
    />
  );
};
export default Icon;
