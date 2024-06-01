/// <reference types="vite/client" />

declare module "*.svg?url" {
  const content: string;
  export default content;
}

declare module "*.module.scss" {
  const content: { [className: string]: string };
  export default content;
}
