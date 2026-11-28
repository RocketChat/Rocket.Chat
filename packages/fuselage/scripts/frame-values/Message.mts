import { join } from 'node:path';

import { constant, focusRing, pressable, textPart, truncated } from './lib/messageFrames.mts';
import type { Target } from './lib/target.mts';
import { fontScale, offScale, themed } from './lib/tokens.mts';

const component = (file: string) => join(import.meta.dirname, '../../src/components/Message', file);

const generateNameContainer = () =>
	[
		constant('messageNameContainerFrame', textPart({ flexShrink: 0, ...truncated, color: themed('font-titles-labels'), ...focusRing })),
		// In the header a long name gives way before the timestamp and the indicators do
		constant('messageNameContainerInHeader', { flexShrink: 1 }),
		constant('messageNameContainerPressable', pressable),
	].join('\n');

const generateBody = () =>
	[
		constant(
			'messageBodyFrame',
			textPart({
				display: 'block',
				overflow: 'hidden',
				// Padding rather than margin, so the clipped overflow leaves room for emoji glyphs that paint past their line box
				paddingBlock: offScale(2),
				wordBreak: 'break-word',
				color: themed('font-default'),
				...fontScale('p2'),
			}),
		),
		constant('messageBodyPending', { opacity: 0.4 }),
	].join('\n');

const generateBlock = () =>
	[
		// A block can hold bare text, so it is a text part laid out as a column
		constant('messageBlockFrame', textPart({ display: 'flex', flexDirection: 'column' })),
		constant('messageBlockFixedWidth', { maxWidth: 368 }),
	].join('\n');

const generateHighlight = () =>
	[
		constant('messageHighlightFrame', textPart({ whiteSpace: 'nowrap', fontWeight: '500', ...focusRing })),
		constant('messageHighlightTones', {
			critical: { color: themed('status-font-on-danger') },
			relevant: { color: themed('status-font-on-service-1') },
			other: { color: themed('status-font-on-warning') },
			link: { color: themed('status-font-on-info') },
		}),
		constant('messageHighlightPressable', pressable),
	].join('\n');

export default [
	{ file: component('MessageNameContainer.tsx'), generate: generateNameContainer },
	{
		file: component('MessageName.tsx'),
		generate: () => constant('messageNameFrame', textPart({ ...truncated, color: themed('font-titles-labels'), ...fontScale('h5') })),
	},
	{
		file: component('MessageUsername.tsx'),
		generate: () => constant('messageUsernameFrame', textPart({ ...truncated, color: themed('font-default') })),
	},
	{ file: component('MessageBody.tsx'), generate: generateBody },
	{ file: component('MessageBlock.tsx'), generate: generateBlock },
	{ file: component('MessageHighlight.tsx'), generate: generateHighlight },
] satisfies Target[];
