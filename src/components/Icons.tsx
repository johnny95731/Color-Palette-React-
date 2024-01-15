import React, {useMemo} from "react";
import "./icons.scss";

import CloseUrl from "@/assets/icons/x-lg.svg?url";
import DelUrl from "@/assets/icons/trash3-fill.svg?url";
import LockUrl from "@/assets/icons/lock-fill.svg?url";
import UnlockUrl from "@/assets/icons/unlock-fill.svg?url";
import FavUrl from "@/assets/icons/star-fill.svg?url";
import UnfavUrl from "@/assets/icons/star.svg?url";
import DrapUrl from "@/assets/icons/arrows.svg?url";
import RefreshUrl from "@/assets/icons/arrow-clockwise.svg?url";
import SliderUrl from "@/assets/icons/sliders.svg?url";
import CopyUrl from "@/assets/icons/copy.svg?url";
import SortUrl from "@/assets/icons/sort-down.svg?url";
import InsertUrl from "@/assets/icons/file-earmark-plus.svg?url";
import AppendtUrl from "@/assets/icons/arrows-expand-vertical.svg?url";
import FavPalleteUrl from "@/assets/icons/bookmark-plus.svg?url";
import UnfavPalleteUrl from "@/assets/icons/bookmark-dash.svg?url";
import BookmarkUrl from "@/assets/icons/bookmarks.svg?url";
import ListUrl from "@/assets/icons/list.svg?url";
import caretUrl from "@/assets/icons/caret-left-fill.svg?url";
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
