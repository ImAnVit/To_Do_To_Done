# miniprogram-ts-less-quickstart

This is a simple task manager for WeChat.

## Features

- TypeScript support with official API typings
- Less preprocessor for styles
- Zero-config setup for rapid development

## Prerequisites

- [Node.js](https://nodejs.org/) (>= 12.x)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [WeChat DevTools](https://developers.weixin.qq.com/miniprogram/en/dev/devtools/download.html)

## Installation

```bash
# Install dependencies
tnpm install
# or
npm install
# or
yarn install
```

## Project Structure

```text
miniprogram-1/
├── miniprogram         # Mini Program source code
│   ├── pages           # Page directories (TS, WXML, WXSS, JSON)
│   └── utils           # Utility modules
├── images              # Static assets
├── typings             # Type definitions (e.g., API typings)
├── app.json            # Global configuration
├── tsconfig.json       # TypeScript configuration
├── package.json        # npm configuration & dependencies
└── project.config.json # WeChat project settings
```

## Usage

1. Open the project folder in WeChat DevTools.
2. Compile and preview the Mini Program in the emulator.
3. Make changes to `.ts`, `.less`, `.wxml` files under `miniprogram`.
4. The DevTools will automatically watch and rebuild on file save.

## Scripts

Currently, no custom npm scripts are defined. You can add build or lint scripts in `package.json` if needed.

## Contributing

Feel free to submit issues or pull requests. For major changes, please open an issue first to discuss what you would like to change.

## License

Specify your license here (e.g., MIT).

---

*Generated on 2025-06-04*
