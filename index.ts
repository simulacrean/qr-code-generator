import QRCode from 'easyqrcodejs-nodejs';
import process from 'node:process';
import { parseArgs } from 'node:util';

// Defaults for optional settings. `text` and `logo` are required and have
// no defaults, they must be supplied on the command line.
const DEFAULTS = {
  width: 8000,
  height: 8000,
  logoWidth: 3000,
  logoHeight: 3000,
  quality: 1,
} as const;

const DEFAULT_OUT_FILE_PREFIX = 'qr_code';
const DEFAULT_OUT_FILE_SUFFIX = 'image';

// A QR code needs a "quiet zone" (blank margin) around it to be reliably
// scannable. easyqrcodejs defaults this to 0, so we add one by default,
// sized as a fraction of the QR width (roughly the 4-module minimum).
const QUIET_ZONE_FRACTION = 0.02;

const USAGE = `Usage: npm run generate -- --text <text> --logo <path> [options]

Required:
  --text <text>            Text/URL to encode in the QR code
  --logo <path>            Path to the logo image to embed

Optional:
  --width <px>             QR code width in pixels (default: ${DEFAULTS.width})
  --height <px>            QR code height in pixels (default: ${DEFAULTS.height})
  --logo-width <px>        Logo width in pixels (default: ${DEFAULTS.logoWidth})
  --logo-height <px>       Logo height in pixels (default: ${DEFAULTS.logoHeight})
  --quality <0-1>          Output image quality (default: ${DEFAULTS.quality})
  --quiet-zone <px>        Blank margin around the QR (default: ${Math.round(100 * QUIET_ZONE_FRACTION)}% of width)
  --out-file-prefix <str>  Output filename prefix (default: ${DEFAULT_OUT_FILE_PREFIX})
  --out-file-suffix <str>  Output filename suffix (default: ${DEFAULT_OUT_FILE_SUFFIX})
  --no-shorten             Do not shorten the URL (shortening is on by default)
  -h, --help               Show this help message
`;

interface QRConfig {
  text: string;
  logo: string;
  width: number;
  height: number;
  logoWidth: number;
  logoHeight: number;
  quality: number;
  quietZone: number;
  quietZoneColor: string;
}

interface ParsedOptions {
  config: QRConfig;
  outFilePrefix: string;
  outFileSuffix: string;
  shorten: boolean;
}

/**
 * Shorten a URL using the free TinyURL API (no API key required).
 * The `api-create.php` endpoint returns the short URL as plain text on
 * success, or a body beginning with "Error" on failure.
 * Returns the shortened URL, or exits with an error on failure.
 */
const shortenUrl = async (url: string): Promise<string> => {
  const endpoint = `https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`;

  let response: Response;
  try {
    response = await fetch(endpoint);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`Error: failed to reach the URL shortener: ${message}`);
    process.exit(1);
  }

  const body = (await response.text()).trim();

  // TinyURL signals failure with a non-2xx status or a body starting with
  // "Error" (e.g. an invalid or unreachable URL).
  if (!response.ok || /^error/i.test(body)) {
    console.error(`Error: URL shortener failed (HTTP ${response.status}): ${body || 'no response body'}`);
    process.exit(1);
  }

  return body;
};

const parseConfig = (): ParsedOptions => {
  const { values } = parseArgs({
    options: {
      text: { type: 'string' },
      logo: { type: 'string' },
      width: { type: 'string' },
      height: { type: 'string' },
      'logo-width': { type: 'string' },
      'logo-height': { type: 'string' },
      quality: { type: 'string' },
      'quiet-zone': { type: 'string' },
      'out-file-prefix': { type: 'string' },
      'out-file-suffix': { type: 'string' },
      shorten: { type: 'boolean' },
      'no-shorten': { type: 'boolean' },
      help: { type: 'boolean', short: 'h' },
    },
  });

  if (values.help) {
    console.log(USAGE);
    process.exit(0);
  }

  const missing = (['text', 'logo'] as const).filter((key) => values[key] === undefined);
  if (missing.length > 0) {
    console.error(`Error: missing required argument(s): ${missing.map((k) => `--${k}`).join(', ')}\n`);
    console.error(USAGE);
    process.exit(1);
  }

  const toNumber = (name: string, value: string): number => {
    const parsed = Number(value);
    if (Number.isNaN(parsed)) {
      console.error(`Error: --${name} must be a number, got "${value}"\n`);
      process.exit(1);
    }
    return parsed;
  };

  const width = values.width !== undefined ? toNumber('width', values.width) : DEFAULTS.width;
  const height = values.height !== undefined ? toNumber('height', values.height) : DEFAULTS.height;

  const config: QRConfig = {
    text: values.text as string,
    logo: values.logo as string,
    width,
    height,
    logoWidth: values['logo-width'] !== undefined ? toNumber('logo-width', values['logo-width']) : DEFAULTS.logoWidth,
    logoHeight: values['logo-height'] !== undefined ? toNumber('logo-height', values['logo-height']) : DEFAULTS.logoHeight,
    quality: values.quality !== undefined ? toNumber('quality', values.quality) : DEFAULTS.quality,
    quietZone: values['quiet-zone'] !== undefined
      ? toNumber('quiet-zone', values['quiet-zone'])
      : Math.round(width * QUIET_ZONE_FRACTION),
    quietZoneColor: '#ffffff',
  };

  const outFilePrefix = values['out-file-prefix'] ?? DEFAULT_OUT_FILE_PREFIX;
  const outFileSuffix = values['out-file-suffix'] ?? DEFAULT_OUT_FILE_SUFFIX;

  // Shortening is on by default; `--no-shorten` opts out.
  const shorten = values['no-shorten'] ? false : true;

  return { config, outFilePrefix, outFileSuffix, shorten };
};

/**
 * Create new QR code with config and settings in `./output` folder.
 */
const main = async (): Promise<void> => {
  const { config, outFilePrefix, outFileSuffix, shorten } = parseConfig();

  if (shorten) {
    const shortUrl = await shortenUrl(config.text);
    console.log(`Shortened "${config.text}" -> "${shortUrl}"`);
    config.text = shortUrl;
  }

  const qrCode = new QRCode({ ...config });

  qrCode.saveImage({
    path: `${process.cwd()}/output/${outFilePrefix}_${new Date().toJSON()}_${outFileSuffix}.jpg`,
  });
};

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
