// The `easyqrcodejs-nodejs` package ships no type declarations, so provide a
// minimal ambient module declaration to satisfy the compiler.
declare module 'easyqrcodejs-nodejs' {
  interface QRCodeOptions {
    text: string;
    logo?: string;
    width?: number;
    height?: number;
    logoWidth?: number;
    logoHeight?: number;
    quality?: number;
    [key: string]: unknown;
  }

  class QRCode {
    constructor(options: QRCodeOptions);
    saveImage(options: { path: string }): void;
  }

  export = QRCode;
}
