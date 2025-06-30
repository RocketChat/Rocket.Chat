import type { Linter } from 'eslint';

export type Config<T extends Linter.RulesRecord> = Omit<Linter.Config<T>, 'plugins' | 'name'>;
