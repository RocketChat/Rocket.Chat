import { Linter } from 'eslint';

type RulesConfig<T extends Linter.RulesRecord> = {
	rules: T;
};

export function rules<T extends Linter.RulesRecord>(rules: T): RulesConfig<T> {
	return { rules };
}
