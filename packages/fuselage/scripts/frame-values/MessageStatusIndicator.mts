import { join } from 'node:path';

import { constant, textPart, viewPart } from './lib/messageFrames.mts';
import type { Target } from './lib/target.mts';
import { themed } from './lib/tokens.mts';

const component = (file: string) => join(import.meta.dirname, '../../src/components/Message/MessageStatusIndicator', file);

export default [
	{
		file: component('MessageStatusIndicator.tsx'),
		// The indicators sit on the header's text line, so the box that holds them is a block of inline content
		generate: () => constant('messageStatusIndicatorFrame', viewPart({ display: 'block', userSelect: 'none' })),
	},
	{
		file: component('MessageStatusPrivateIndicator.tsx'),
		generate: () => constant('messageStatusPrivateIndicatorFrame', textPart({ color: themed('font-secondary-info') })),
	},
] satisfies Target[];
