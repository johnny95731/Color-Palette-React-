import React, {useCallback, useState} from "react";
import Select from "../Customs/Select.tsx";
import Slider from "../Customs/Slider.tsx";
import Switch from "../Customs/Switch.tsx";
import Icon from "../Customs/Icons.tsx";
import css from "./index.scss";
// Utils
import {
  CURRENT_OPTION_WEIGHT, SETTINGS, BORDER_COLOR, BORDER_MAX_WIDTH,
  CONTRAST_METHODS,
  GAMMA_MAX,
  MULTIPLICATION_MAX,
} from "@/common/utils/constants.ts";
// Store
import {
  useAppDispatch, useAppSelector, selectSettings,
} from "@/features";
import {setPltIsEditing, adjustContrast} from "slices/pltSlice.ts";
import {setBorder, setTransition} from "slices/settingsSlice";
// Types
import type {TransitionType} from "types/settingType.ts";
import type {ContrastMethods} from "types/pltType.ts";

const currentPageStyle: React.CSSProperties = {
  ...CURRENT_OPTION_WEIGHT,
  color: css.color5,
  backgroundColor: css.color1,
};


const CardPage = () => {
  // States and handler
  const {border, transition} = useAppSelector(selectSettings);
  // -Border states
  const [showBorder, setShowBorder] = useState<boolean>(() => border.show);
  const [currentWidth, setCurrentWidth] = useState<number>(() => border.width);
  // -Transition states
  const [posTime, setPosTime] = useState(() => transition.pos);
  const [colorTime, setColorTime] = useState(() => transition.color);
  const dispatch = useAppDispatch();

  const handleSwitchStyle = (isOn: boolean) => {
    setShowBorder(isOn);
    dispatch(setBorder({
      attr: "show",
      val: isOn,
    }));
  };
  const handleWidth = (e: React.ChangeEvent<HTMLInputElement>) => {
    const target = e.currentTarget;
    const val = Number(target.value);
    setCurrentWidth(val);
    dispatch(setBorder({
      attr: "width",
      val,
    }));
  };
  const handleSelectColor = (val: string) => {
    dispatch(setBorder({
      attr: "color",
      val,
    }));
  };
  const handleTransitionChanged = (
      val: number, attr: keyof TransitionType,
  ) => {
    if (attr === "pos")setPosTime(val);
    else setColorTime(val);
    dispatch(setTransition({attr, val}));
  };
  return (
    <>
      <h6>Border</h6>
      <label>Show</label>
      <Switch defaultValue={showBorder}
        onClick={handleSwitchStyle}
      />
      {showBorder &&
        <>
          <label className={css.subOption}>┠ Width(px)</label>
          <input type="number" min="1" max={BORDER_MAX_WIDTH}
            className={css.subOption}
            value={currentWidth}
            onChange={handleWidth}
          />
          <label className={css.subOption}>┖ Color</label>
          <Select options={BORDER_COLOR} onSelect={handleSelectColor}
            className={css.subOption}
          />
        </>
      }
      <h6>Transition</h6>
      <label>Position(ms)</label>
      <Slider min={0} max={1000} digit={0} step={50}
        value={posTime} onChange={(e) => handleTransitionChanged(e, "pos")}
      />
      <label>Color(ms)</label>
      <Slider min={0} max={2000} digit={0} step={50}
        value={colorTime} onChange={(e) => handleTransitionChanged(e, "color")}
      />
    </>
  );
};


const ContrastPage = () => {
  const dispatch = useAppDispatch();
  const [method, setMethod] = useState<ContrastMethods>(CONTRAST_METHODS[0]);
  const [coeff, setCoeff] = useState(() => 1);

  const selectMethod = (method: string) => {
    setMethod(method as ContrastMethods);
    dispatch(adjustContrast({
      method,
      gamma: coeff,
    }));
  };
  const contrastCoeffChanged = (val: number) => {
    setCoeff(val);
    dispatch(adjustContrast({
      method: method,
      gamma: val,
    }));
  };
  const handleApply = useCallback(() => {
    dispatch(setPltIsEditing("start"));
    selectMethod(CONTRAST_METHODS[0]);
    contrastCoeffChanged(1);
  }, []);
  const handleReset = useCallback(() => {
    dispatch(setPltIsEditing("reset"));
    selectMethod(CONTRAST_METHODS[0]);
    contrastCoeffChanged(1);
  }, []);
  const max = method === "gamma" ? GAMMA_MAX : MULTIPLICATION_MAX;
  return (
    <>
      <label>Method</label>
      <Select options={CONTRAST_METHODS} value={method}
        onSelect={selectMethod}
      />
      <label>
        {method === "gamma" ? "gamma" : "scale"}
      </label>
      <Slider min={0} max={max} value={coeff}
        onChange={contrastCoeffChanged}
      />
      <div className={css.buttons}>
        <button type="button" className={css.applyBtn}
          onClick={handleApply}
        >
          Apply
        </button>
        <button type="button" className={css.resetBtn}
          onClick={handleReset}
        >
          Reset
        </button>
      </div>
    </>
  );
};


const SettingDialog = ({
  showingChanged,
}: {
  showingChanged: () => void;
}) => {
  const dispatch = useAppDispatch();
  const [page, setPage] = useState(() => 0);
  const pageChanged = (i: number) => {
    setPage(i);
    // Page 1 is contrast.
    dispatch(setPltIsEditing(i === 1 ? "start" : "cancel"));
  };

  return (
    <div className={css.settingDialog} >
      <h5>Settings</h5>
      <Icon type="close" onClick={showingChanged}/>
      <div className={css.sidebar}>
        {
          SETTINGS.map((opt, i) => (
            <div key={`setting-${opt}`}
              style={page === i ? currentPageStyle : undefined}
              onClick={() => pageChanged(i)}
            >
              {opt}
            </div>
          ))
        }
      </div>
      <div className={css.content}>
        {page === 0 && <CardPage />}
        {page === 1 && <ContrastPage />}
      </div>
    </div>
  );
};
export default SettingDialog;
