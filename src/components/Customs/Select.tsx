import React, {useEffect, useState} from "react";
import TriangleUrl from "@/assets/icons/triangle-down.svg?url";
import css from "./menu.module.scss";
import {showPopupMenu} from "@/common/utils/helpers.ts";
import {MouseHandler, FocusHandler} from "types/eventHandler.ts";
import {CURRENT_OPTION_WEIGHT} from "@/common/utils/constants";

const Select = ({
  options,
  defaultValue,
  value,
  contentClass = css.menuContent,
  className,
  onSelect,
}: {
  options: readonly string[];
  defaultValue?: string;
  value?: string;
  contentClass?: string;
  className?: string;
  onSelect?: (val: string) => any;
}): React.JSX.Element => {
  const [currentVal, setCurrentVal] = useState(
      () => defaultValue ? defaultValue : (value ? value : options[0]),
  );
  // Handle prop `value` changed.
  useEffect(() => {
    if (value && value !== currentVal && options.includes(value)) {
      setCurrentVal(value);
    }
  }, [value]);

  const handleSelect: MouseHandler = (e) => {
    const target = e.currentTarget;
    const val = target.innerText;
    if (onSelect) onSelect(val);
    setCurrentVal(val);
  };

  const containerClass = (
    className ? `${className} ${css.selectMenu}` : css.selectMenu
  );

  return (
    <span className={containerClass}
      tabIndex={-1}
      onClick={showPopupMenu as MouseHandler}
      onBlur={showPopupMenu as FocusHandler}
    >
      <div className={css.menuTitle}>
        {currentVal}
        <img src={TriangleUrl} alt="clickable" className={css.triangle} />
      </div>
      <ul className={contentClass}>
        {
          options.map((val) => (
            <li key={`Option ${val}`}
              onClick={handleSelect}
              style={val === currentVal ? CURRENT_OPTION_WEIGHT : undefined}
            >
              {val}
            </li>
          ))
        }
      </ul>
    </span>
  );
};
export default Select;
