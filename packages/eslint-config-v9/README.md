# @rocket.chat/eslint-config-v9

Rocket.Chat's ESLint configuration for ESLint 9 using the new Flat Config format.

## Features

- ESLint 9 with Flat Config format
- TypeScript support
- React support
- Prettier integration
- Import/export rules
- Best practices and error detection

## Installation

```bash
npm install --save-dev @rocket.chat/eslint-config-v9
```

## Usage

Create an `eslint.config.js` (or `eslint.config.mjs`) file in your project root:

```javascript
import standard from '@rocket.chat/eslint-config-v9/standard/index.js';

export default [
	...standard,
	{
		// Your project-specific overrides
	},
];
```

## Structure

- `standard/` - Main configuration combining all rules
- `original/` - Base configuration
- `best-practices/` - Best practice rules
- `errors/` - Error detection rules
- `es6/` - ES6+ specific rules
- `imports/` - Import/export rules
- `node/` - Node.js specific rules
- `style/` - Code style rules
- `variables/` - Variable-related rules
- `react.js` - React-specific configuration

## Migration from ESLint 8

This package uses ESLint 9's Flat Config format, which is different from the legacy `.eslintrc` format:

- Uses `eslint.config.js` instead of `.eslintrc.json`
- Uses ES modules (`export default`) instead of CommonJS
- Plugins are imported and used differently
- No more `extends` - use spread operator to combine configs

