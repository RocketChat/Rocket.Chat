import securityPlugin from 'eslint-plugin-security';
import type { Linter } from 'eslint';
import { getRules, toPlugin } from './helpers/plugin.js';

const plugin = toPlugin(securityPlugin);

export default function security({ rules, ...config }: Linter.Config = {}) {
	return {
		name: 'security',
		plugins: {
			security: plugin,
		},
		rules: {
			...getRules(plugin, 'recommended'),
			...rules,
		},
		...config,
	};
}
