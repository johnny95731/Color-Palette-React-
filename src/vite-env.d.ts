/// <reference types="vite/client" />

declare module "*.svg?url" {
  const content: string;
  export default content;
}

declare module "*.module.scss" {
  const classes: Record<string, string>
  export default classes;
}
