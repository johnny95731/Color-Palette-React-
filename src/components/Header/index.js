import React from "react";
import styles from "./index.scss";

const Header = ({
  refresh,
  sortCard,
  optionChanged,
}) => {
  return (
    <header className={styles.header}>
      <h1 className={styles.title}>
        Color Palette
      </h1>
      <div className={styles.btnContainer}>
        <span className={styles.btn} onClick={refresh}>Refresh</span>
        <span className={`${styles.btn} ${styles.dropdownMenu}`}>
          Sort
          <div className={styles.dropdownContent}>
            <div onClick={() => sortCard("gray")}>Gray</div>
            <div onClick={() => sortCard("random")}>Random</div>
            <div onClick={() => sortCard("invert")}>Invert</div>
          </div>
        </span>
        <span className={`${styles.btn} ${styles.dropdownMenu}`}>
          Insert Alg
          <div className={styles.dropdownContent}>
            {
              ["RGB Mean", "Random"].map((val, i) => {
                return (
                  <div key={`mode${i}`}
                    onClick={(e) => optionChanged(e, "insert", i)}
                  >
                    {val}
                  </div>
                );
              })
            }
          </div>
        </span>
        <span className={`${styles.btn} ${styles.dropdownMenu}`}>
          Mode
          <div className={styles.dropdownContent}>
            {
              ["RGB", "HSB", "HSL", "CMY"].map((val, i) => {
                return (
                  <div key={`mode${i}`}
                    onClick={(e) => optionChanged(e, "mode", i)}
                  >
                    {val}
                  </div>
                );
              })
            }
            {/* <div onClick={modeChanged}>RGB</div>
            <div onClick={modeChanged}>HSB</div>
            <div onClick={modeChanged}>HSL</div>
            <div onClick={modeChanged}>CMY</div> */}
          </div>
        </span>
      </div>
    </header>
  );
};
export default Header;
