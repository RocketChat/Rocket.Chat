import { join } from 'node:path';

import { selectionFrames } from './lib/selectionFrames.mts';
import type { Target } from './lib/target.mts';
import { radius, size } from './lib/tokens.mts';

const targets: Target[] = [
	{
		file: join(import.meta.dirname, '../../src/components/RadioButton/RadioButton.tsx'),
		generate: () =>
			selectionFrames({
				prefix: 'radioButton',
				radius: radius('full'),
				fake: { display: 'flex', justifyContent: 'center', alignItems: 'center', width: size('x20') },
			}),
	},
];

export default targets;
