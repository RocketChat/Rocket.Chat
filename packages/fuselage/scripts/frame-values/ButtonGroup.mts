import { join } from 'node:path';

import { literal, type Value } from './lib/literal.mts';
import type { Target } from './lib/target.mts';
import { spacing } from '../../src/styleTokens.ts';

const file = join(import.meta.dirname, '../../src/components/ButtonGroup/ButtonGroup.tsx');

const generateButtonGroup = () => {
	const out: string[] = [];
	const constant = (name: string, value: Value) => out.push(`const ${name} = ${literal(value)};`);

	constant('smallGap', { gap: spacing('x4') });
	constant('mediumGap', { gap: spacing('x8') });
	constant('largeGap', { gap: spacing('x16') });

	return out.join('\n\n');
};

export default [{ file, generate: generateButtonGroup }] satisfies Target[];
