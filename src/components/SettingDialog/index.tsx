import React, { useCallback, useState } from 'react';
import Select from '../Customs/Select.tsx';
import Slider from '../Customs/Slider.tsx';
import Switch from '../Customs/Switch.tsx';
import Icon from '../Customs/Icons.tsx';
import css from './index.module.scss';
// Utils
import {
  CURRENT_OPTION_WEIGHT, BORDER_COLOR, BORDER_MAX_WIDTH, CONTRAST_METHODS,
  GAMMA_MAX, MULTIPLICATION_MAX, TRANSITION_MAX_POS, TRANSITION_MAX_COLOR,
} from '@/common/utils/constants.ts';
// Store
import {
  useAppDispatch, useAppSelector, selectSettings,
} from '@/features';
import { setPltIsEditing, adjustContrast } from 'slices/pltSlice.ts';
import { setBorder, setTransition } from 'slices/settingsSlice';
// Types
import type { TransitionType } from 'types/settingType.ts';
import type { ContrastMethods } from 'types/pltType.ts';

const currentPageStyle: React.CSSProperties = {
  ...CURRENT_OPTION_WEIGHT,
  color: css.color5,
  backgroundColor: css.color1,
};


const CardPage = () => {
  // States and handler
  const { border, transition } = useAppSelector(selectSettings);
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
      attr: 'show',
      val: isOn,
    }));
  };
  const handleWidth = (val: number) => {
    setCurrentWidth(val);
    dispatch(setBorder({
      attr: 'width',
      val,
    }));
  };
  const handleSelectColor = (val: string) => {
    dispatch(setBorder({
      attr: 'color',
      val,
    }));
  };
  const handleTransitionChanged = (
      val: number, attr: keyof TransitionType,
  ) => {
    if (attr === 'pos')setPosTime(val);
    else setColorTime(val);
    dispatch(setTransition({ attr, val }));
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
          <Slider min={1} max={BORDER_MAX_WIDTH} step={1}
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
      <Slider min={0} max={TRANSITION_MAX_POS} digit={0} step={50}
        value={posTime} onChange={(e) => handleTransitionChanged(e, 'pos')}
      />
      <label>Color(ms)</label>
      <Slider min={0} max={TRANSITION_MAX_COLOR} digit={0} step={50}
        value={colorTime} onChange={(e) => handleTransitionChanged(e, 'color')}
      />
    </>
  );
};

type ContrastArgsType = {
  method: ContrastMethods;
  coeff: number;
}
const ContrastPage = ({
  contrastArgs,
  contrastChanged,
}: {
  contrastArgs: ContrastArgsType;
  contrastChanged: (newObj: Partial<ContrastArgsType>) => void;
}) => {
  const dispatch = useAppDispatch();
  const contrastBtnEvent = useCallback((ev: 'start' | 'reset') => {
    dispatch(setPltIsEditing(ev));
    contrastChanged({ coeff: 1 });
  }, []);
  const max = contrastArgs.method === 'gamma' ? GAMMA_MAX : MULTIPLICATION_MAX;
  return (
    <>
      <label>Method</label>
      <Select options={CONTRAST_METHODS} value={contrastArgs.method}
        onSelect={(newVal) => contrastChanged({
          method: newVal as ContrastMethods,
        })}
      />
      <label>
        {contrastArgs.method === 'gamma' ? 'gamma' : 'scale'}
      </label>
      <Slider min={0} max={max} value={contrastArgs.coeff}
        onChange={(newVal) => contrastChanged({
          method: contrastArgs.method,
          coeff: newVal,
        })}
      />
      <div className={css.buttons}>
        <button type="button" className={css.applyBtn}
          onClick={() => contrastBtnEvent('start')}
        >
          Apply
        </button>
        <button type="button" className={css.resetBtn}
          onClick={() => contrastBtnEvent('reset')}
        >
          Reset
        </button>
      </div>
    </>
  );
};

const SETTINGS = ['Card', 'Contrast'] as const;

const SettingDialog = ({
  showingChanged,
}: {
  showingChanged: () => void;
}) => {
  const dispatch = useAppDispatch();
  const [contrastArgs, setContrastArgs] = useState<ContrastArgsType>({
    method: CONTRAST_METHODS[0],
    coeff: 1,
  });
  const contrastChanged = (newObj: Partial<ContrastArgsType>) => {
    setContrastArgs((prev) => Object.assign({}, prev, newObj));
    dispatch(adjustContrast(contrastArgs));
  };

  const [page, setPage] = useState(() => 0);
  const pageChanged = (i: number) => {
    setPage(i);
    // Page 1 is contrast.
    if (i === 1) {
      dispatch(setPltIsEditing('start'));
      contrastChanged(contrastArgs);
    } else if (page === 1) dispatch(setPltIsEditing('cancel'));
  };

  return (
    <div className={css.settingDialog} >
      <header className={css.header}>
        <h5>Settings</h5>
        <Icon type="close" onClick={showingChanged}/>
      </header>
      <div className={css.menubar}>
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
        {page === 1 &&
          <ContrastPage
            contrastArgs={contrastArgs}
            contrastChanged={contrastChanged}
          />
        }
      </div>
    </div>
  );
};
export default SettingDialog;
