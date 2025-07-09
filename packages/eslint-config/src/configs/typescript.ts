import tseslint from 'typescript-eslint';
import type { Linter } from 'eslint';

export default function typescript(config: Linter.Config = {}) {
	return [...tseslint.configs.recommendedTypeChecked, config];
}
