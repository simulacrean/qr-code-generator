# qr-code-generator

Generate a QR code with an embedded logo from the command line. The encoded
URL is shortened (via TinyURL) by default, and the image is written to the
`output/` folder.

This is a thin CLI wrapper around
[`easyqrcodejs-nodejs`](https://www.npmjs.com/package/easyqrcodejs-nodejs),
which does the actual QR code rendering. URL shortening is handled by the free
[TinyURL](https://tinyurl.com) API (no account or API key required).

## Requirements

- Node.js 18 or newer (uses the built-in `fetch` and `util.parseArgs`)

## Install

```bash
npm install
```

## Usage

```bash
npm run generate -- --text <text> --logo <path> [options]
```

Required:

| Flag       | Description                          |
| ---------- | ------------------------------------ |
| `--text`   | Text or URL to encode in the QR code |
| `--logo`   | Path to the logo image to embed      |

Optional:

| Flag                | Default    | Description                                   |
| ------------------- | ---------- | --------------------------------------------- |
| `--width`           | `8000`     | QR code width in pixels                       |
| `--height`          | `8000`     | QR code height in pixels                      |
| `--logo-width`      | `3000`     | Logo width in pixels                          |
| `--logo-height`     | `3000`     | Logo height in pixels                         |
| `--quality`         | `1`        | Output image quality (0-1)                    |
| `--quiet-zone`      | 6% of width | Blank margin around the QR (needed to scan)  |
| `--out-file-prefix` | `qr_code`  | Output filename prefix                        |
| `--out-file-suffix` | `image`    | Output filename suffix                        |
| `--no-shorten`      | off        | Skip URL shortening and encode `--text` as-is |
| `-h`, `--help`      |            | Show help                                     |

Note the `--` after `npm run generate`: it tells npm to forward the flags to
the script rather than consuming them itself.

## Examples

Minimal (URL is shortened by default):

```bash
npm run generate -- --text "https://example.com/a/very/long/link" --logo ./assets/logo.jpg
```

Encode the URL exactly as given, with a custom size:

```bash
npm run generate -- \
  --text "https://example.com/page" \
  --logo ./assets/logo.jpg \
  --width 1200 --height 1200 \
  --logo-width 400 --logo-height 400 \
  --no-shorten
```

## Output

Images are saved to `output/` as:

```
output/<prefix>_<ISO timestamp>_<suffix>.jpg
```

## Scripts

- `npm run generate`: build a QR code (see above)
- `npm run typecheck`: type-check the TypeScript sources
