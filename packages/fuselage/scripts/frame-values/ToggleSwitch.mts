import { join } from 'node:path';

import { selectionFrames } from './lib/selectionFrames.mts';
import type { Target } from './lib/target.mts';
import { radius, size } from './lib/tokens.mts';

const targets: Target[] = [
	{
		file: join(import.meta.dirname, '../../src/components/ToggleSwitch/ToggleSwitch.tsx'),
		generate: () =>
			selectionFrames({
				prefix: 'toggleSwitch',
				radius: radius('full'),
				fake: { display: 'block', width: size('x36'), height: size('x18') },
			}),
	},
];

export default targets;
