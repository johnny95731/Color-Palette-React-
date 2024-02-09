import React, {useMemo, useState} from "react";
import css from "./switch.scss";

const switchStyle = {
  on: {
    left: "calc(100% - 5px)",
    transform: "translate(-100%, -50%)",
  },
  off: {
    left: "5px",
    transform: "translateY(-50%)",
  },
};

const Switch = ({
  onClick,
  defaultValue = false,
  text = ["On", "Off"],
}: {
  onClick?: (isOn: boolean) => void;
  defaultValue?: boolean;
  /**
   * strings [On, Off] for on/off states.
   */
  text?: readonly [string, string];
}) => {
  const [isOn, setIsOn] = useState(() => defaultValue);
  const handleClick = () => {
    if (onClick) onClick(!isOn);
    setIsOn(!isOn);
  };
  const msg = useMemo(() => text ? text : null, []);
  return (
    <div className={`${css.wrapper} ${isOn ? css.active : ""}`}
      onClick={handleClick}
    >
      <div className={css.circle}
        style={switchStyle[isOn ? "on" : "off"]}
      />
      {
        msg &&
        <span>{isOn ? msg[0] : msg[1]}</span>
      }
    </div>
  );
};
export default Switch;
