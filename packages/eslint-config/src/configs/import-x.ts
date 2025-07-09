import { importX } from 'eslint-plugin-import-x';
import { toPlugin } from './helpers/plugin.js';

import type { Linter } from 'eslint';

export default function importXConfig({ rules, settings, ...config }: Linter.Config = {}) {
	return {
		name: 'import-x/config',
		plugins: {
			'import-x': toPlugin(importX),
		},
		rules: {
			...importX.flatConfigs.recommended.rules,
			...importX.flatConfigs.typescript.rules,
			...rules,
		},
		settings: {
			...importX.flatConfigs.recommended.settings,
			...importX.flatConfigs.typescript.settings,
			...settings,
		},
		...config,
	};
}
