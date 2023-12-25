import React from "react";

export interface ChangeEventHandler {
  (e?: React.ChangeEvent<HTMLInputElement>): void | boolean;
}

export type MouseEventHandler = {
  (e: React.MouseEvent<HTMLElement>): any | (() => any);
}
