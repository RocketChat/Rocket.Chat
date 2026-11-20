import { join } from 'node:path';

import { literal } from './lib/literal.mts';
import type { Target } from './lib/target.mts';
import { space } from './lib/tokens.mts';

const generateButtonGroup = () =>
	(['x4', 'x8', 'x16'] as const)
		.map((step, index) => `const ${['small', 'medium', 'large'][index]}Gap = ${literal({ gap: space(step) })} as const;`)
		.join('\n\n');

const targets: Target[] = [
	{ file: join(import.meta.dirname, '../../src/components/ButtonGroup/ButtonGroup.tsx'), generate: generateButtonGroup },
];

export default targets;
