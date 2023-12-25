import React, {useMemo} from "react";
import Icon from "../Icons.tsx";
import css from "./menus.scss";
const {
  dropdownMenu, popupMenu, menuContent, menuContentL, menuContentR,
} = css;

import TriangleUrl from "../../../res/img/triangle-down.svg?url";


const showPopupMenu = (
    e: React.MouseEvent<HTMLSpanElement> | React.FocusEvent<HTMLSpanElement>,
): void => {
  const target = e.currentTarget;
  const content = target.lastChild as HTMLDivElement;
  if (e.type === "blur") {
    content.style.display = "none";
    return;
  }
  const display = content.style.display;
  content.style.display = display === "block" ? "none" : "block";
};

export const Menu = ({
  children,
  className,
  iconType,
  title = "menu",
  type = "popup", // ["popup", "dropdown"]
  contentClass = menuContent,
  contentAlign = "center", // ["center" | "left" | "right"]
}: {
  children: React.ReactNode;
  className?: string;
  iconType?: string;
  title?: string;
  type?: string;
  contentClass?: string;
  contentAlign?: "center" | "left" | "right";
}): React.JSX.Element => {
  const menu = useMemo(() => {
    switch (type) {
      case "dropdown":
        return dropdownMenu;
      default:
        return popupMenu;
    }
  }, [type]);
  const align = useMemo(() => {
    switch (contentAlign) {
      case "left":
        return menuContentL;
      case "right":
        return menuContentR;
      default:
        return "";
    }
  }, [contentAlign]);
  return (
    <span className={`${className ? className : ""} ${menu}`}
      tabIndex={-1}
      onClick={type === "popup" ? showPopupMenu : undefined}
      onBlur={type === "popup" ? showPopupMenu : undefined}
    >
      {iconType && <Icon type={iconType} />}
      {title}
      <img src={TriangleUrl} alt="clickable"/>
      <div className={`${contentClass} ${align}`}>
        {children}
      </div>
    </span>
  );
};
