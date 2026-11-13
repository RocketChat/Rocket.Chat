import { join } from 'node:path';

import { font } from './lib/frameTokens.mts';
import { constant, leanText } from './lib/messageFrames.mts';
import type { Target } from './lib/target.mts';
import { webDefaults } from './lib/webDefaults.mts';
import { fontColor, spacing } from '../../src/styleTokens.ts';

const component = (file: string) => join(import.meta.dirname, '../../src/components/Message/MessageMetrics', file);

const generateMessageMetrics = () =>
	constant('messageMetricsFrame', webDefaults({ render: 'div', display: 'flex', marginBlock: spacing('x4')!, gap: spacing('x8')! }));

const generateMessageMetricsItem = () =>
	constant(
		'messageMetricsItemFrame',
		leanText({
			render: 'div',
			display: 'flex',
			justifyContent: 'center',
			alignItems: 'center',
			color: fontColor('default'),
			...font('micro'),
		}),
	);

// The label keeps its start margin, as a metrics item may hold nothing else
const generateMessageMetricsItemLabel = () =>
	constant('messageMetricsItemLabelFrame', leanText({ render: 'div', display: 'block', marginInlineStart: spacing('x4')! }));

const generateMessageMetricsItemAvatarRow = () =>
	constant('messageMetricsAvatarRowFrame', webDefaults({ render: 'div', display: 'flex', gap: spacing('x4')! }));

const targets: Target[] = [
	{ file: component('MessageMetrics.tsx'), generate: generateMessageMetrics },
	{ file: component('MessageMetricsItem/MessageMetricsItem.tsx'), generate: generateMessageMetricsItem },
	{ file: component('MessageMetricsItem/MessageMetricsItemLabel.tsx'), generate: generateMessageMetricsItemLabel },
	{ file: component('MessageMetricsItem/MessageMetricsItemAvatarRow.tsx'), generate: generateMessageMetricsItemAvatarRow },
];

export default targets;
