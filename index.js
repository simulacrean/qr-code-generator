const QRCode = require('easyqrcodejs-nodejs');
const process = require('process')

// SETTINGS

const CONFIG = {
  text: "https://fuckthefourth.com",
  width: 256,
  height: 256,
};

const OUT_FILE_PREFIX = "qr_code"


/**
 * Create new QR code with config and settings in `./output` folder.
 */
const main = () => {
  const qrCode = new QRCode({
    ...CONFIG
  });

  qrCode.saveSVG({
    path: `${process.cwd()}/output/${OUT_FILE_PREFIX}_${new Date().toJSON()}.svg`
  });
};

main();
