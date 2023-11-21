import React, {useMemo} from "react";
import Icon from "../Icons.jsx";
import menuCSS from "./menus.scss";

import TriangleUrl from "../../images/triangle-down.svg?url";
const {
  dropdownMenu, popupMenu, menuContent, menuContentL, menuContentR,
} = menuCSS;

const showPopupMenu = (e) => {
  const target = e.currentTarget;
  const content = target.lastChild;
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
  contentAlign = "C", // ["C", "L", "R"]
}) => {
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
      case "L":
        return menuContentL;
      case "R":
        return menuContentR;
      default:
        return "";
    }
  }, [contentAlign]);
  return (
    <span className={`${className ? className : ""} ${menu}`}
      tabIndex="-1"
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
