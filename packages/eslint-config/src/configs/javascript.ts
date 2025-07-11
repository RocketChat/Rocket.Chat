import js from '@eslint/js';
import type { Linter } from 'eslint';
import type { ESLintRules } from 'eslint/rules';

export default function javascript(config: Linter.Config<ESLintRules> = {}) {
	return [js.configs.recommended, config];
}
