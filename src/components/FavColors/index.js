import React, {useState, useMemo} from "react";
import Icon from "../Icons.jsx";
import styles from "./index.scss";

import {rgb2gray, hex2rgb} from "../../utils/converter.js";
import {copyHex} from "../../utils/helpers.js";

const pageLabels = ["Colors", "Palettes"];
const FavSidebar = ({
  favColors,
  favPlts,
  delColor,
  delPlt,
  isShowing,
  favShowingChanged,
}) => {
  const [page, setPage] = useState(() => 0);

  return isShowing ? (
    <>
      <div className={styles.blank}
        onClick={favShowingChanged}
      />
      <div className={styles.favColors}>
        <nav className={styles.menuBar}>
          {
            pageLabels.map((label, i) => {
              return (
                <span key={`page ${label}`}
                  style={{
                    textDecoration: i === page ? "underline solid 2px" : "none",
                    backgroundColor: i === page ? "#fff" : undefined,
                  }}
                  onClick={() => setPage(i)}
                >
                  {label}
                </span>
              );
            })
          }
          <Icon type="close" events={[["click", favShowingChanged]]}
          />
        </nav>
        {/* Page content */}
        <ul className={styles.pageContent}>
          {page === 0 ?
            favColors.map((hex, i) => {
              return (
                <ColorBlock key={`favColor ${hex}`} hex={hex}
                  delColor={() => delColor(hex)}
                />
              );
            }) :
            favPlts.map((plt) => {
              return (
                <PalleteBlock key={`favPlt ${plt}`} plt={plt}
                  delPlt={() => delPlt(plt)}
                />
              );
            })
          }
        </ul>
      </div>
    </>
  ) : "";
};
export default FavSidebar;


// Other Components
const ColorBlock = ({
  hex,
  delColor,
}) => {
  const isLight = useMemo(() => rgb2gray(hex2rgb(hex)) > 127, [hex]);

  return (
    <li className={styles.colorBlock}
      style={{
        backgroundColor: hex,
        color: isLight ? "black" : "white",
        // border: `1px solid ${isLight ? "#0008" : "#fff8"}`,
      }}
    >
      <div onClick={copyHex}>
        <Icon type="copy"
          style={{
            filter: isLight ? "none" : "invert(1)",
          }}
        />
        {hex}
      </div>
      <span className={styles.delRegion}>
        <Icon type="del" events={[["click", delColor]]} />
      </span>
    </li>
  );
};

const PalleteBlock = ({
  plt,
  delPlt,
}) => {
  const colors = plt.split("-").map((hex) => `#${hex}`);
  const diff = useMemo(() => {
    // Round to 2nd decimal place. Reprecent in percentage.
    return Math.round(10000 / colors.length) / 100;
  }, [colors.length]);
  const bgGrad = useMemo(() => {
    const midPoint = colors.map((hex, i) => {
      return `${hex} ${i * diff}%,${hex} ${(i+1) * diff}%`;
    }).join();
    return midPoint;
  }, [plt]);

  return (
    <li className={styles.palleteBlock}>
      <div style={{background: `linear-gradient(90deg, ${bgGrad})`}} />
      <span className={styles.delRegion}>
        <Icon type="del"
          events={[["click", delPlt]]}
        />
      </span>
      <div>{plt}</div>
    </li>
  );
};
