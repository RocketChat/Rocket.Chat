import { join } from 'node:path';

import { constant, textPart, viewPart } from './lib/messageFrames.mts';
import type { Target } from './lib/target.mts';
import { fontScale, space, themed } from './lib/tokens.mts';

const component = (file: string) => join(import.meta.dirname, '../../src/components/Message/MessageMetrics', file);

export default [
	{
		file: component('MessageMetrics.tsx'),
		generate: () => constant('messageMetricsFrame', viewPart({ flexDirection: 'row', marginBlock: space('x4'), gap: space('x8') })),
	},
	{
		file: component('MessageMetricsItem/MessageMetricsItem.tsx'),
		generate: () =>
			constant(
				'messageMetricsItemFrame',
				textPart({
					display: 'flex',
					flexDirection: 'row',
					justifyContent: 'center',
					alignItems: 'center',
					gap: space('x4'),
					color: themed('font-default'),
					...fontScale('micro'),
				}),
			),
	},
	{
		file: component('MessageMetricsItem/MessageMetricsItemLabel.tsx'),
		generate: () => constant('messageMetricsItemLabelFrame', textPart({ display: 'block' })),
	},
	{
		file: component('MessageMetricsItem/MessageMetricsItemAvatarRow.tsx'),
		generate: () => constant('messageMetricsAvatarRowFrame', viewPart({ flexDirection: 'row', gap: space('x4') })),
	},
] satisfies Target[];
