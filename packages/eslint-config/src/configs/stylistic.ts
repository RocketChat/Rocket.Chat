import stylisticPlugin, { type RuleOptions } from '@stylistic/eslint-plugin';
import { type Linter } from 'eslint';

type Rules = {
	[K in keyof RuleOptions]: Linter.RuleEntry<RuleOptions[K]>;
};

export default function stylistic(config: Linter.Config<Rules> = {}) {
	return [stylisticPlugin.configs.recommended, config];
}
