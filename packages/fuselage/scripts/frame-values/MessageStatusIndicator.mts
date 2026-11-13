import { join } from 'node:path';

import { textFrame } from './lib/itemFrames.mts';
import { literal } from './lib/literal.mts';
import type { Target } from './lib/target.mts';
import { webDefaults } from './lib/webDefaults.mts';
import { fontColor } from '../../src/styleTokens.ts';

const component = (file: string) => join(import.meta.dirname, '../../src/components/Message/MessageStatusIndicator', file);

const generateIndicator = () =>
	`const messageStatusIndicatorFrame = ${literal(webDefaults({ render: 'div', userSelect: 'none' }))} as const;`;

// An inline span: it sits among the icons of the indicator on the line they share
const generatePrivateIndicator = () =>
	`const messageStatusPrivateIndicatorFrame = ${literal(
		textFrame({ render: 'span', display: 'inline', color: fontColor('secondary-info') }),
	)} as const;`;

const targets: Target[] = [
	{ file: component('MessageStatusIndicator.tsx'), generate: generateIndicator },
	{ file: component('MessageStatusPrivateIndicator.tsx'), generate: generatePrivateIndicator },
];

export default targets;
