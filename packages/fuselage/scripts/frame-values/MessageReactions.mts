import { join } from 'node:path';

import { font } from './lib/frameTokens.mts';
import { constant, leanText, messageReveal } from './lib/messageFrames.mts';
import { messagePalettes } from './lib/messagePalettes.mts';
import type { Target } from './lib/target.mts';
import { offScale } from './lib/tokens.mts';
import { webDefaults } from './lib/webDefaults.mts';
import { borderRadius, borderWidth, fontColor, size, spacing, strokeColor } from '../../src/styleTokens.ts';

const component = (file: string) => join(import.meta.dirname, '../../src/components/Message/MessageReactions', file);

const palettes = messagePalettes().reaction;

const generateMessageReactions = () =>
	constant(
		'messageReactionsFrame',
		webDefaults({ render: 'div', display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: spacing('x4')! }),
	);

const generateMessageReaction = () => {
	const thin = borderWidth('default');
	const halo = `0 0 0 ${borderWidth('medium')} ${strokeColor('extra-light-highlight')}`;
	const highlight = strokeColor('highlight');

	// The border starts light, the hover border covers it and the keyboard focus border covers that, as the specificity and order of the stylesheet made them win
	const frame = leanText({
		render: 'div',
		display: 'inline-flex',
		alignItems: 'center',
		padding: offScale(2),
		cursor: 'pointer',
		color: fontColor('hint'),
		borderWidth: thin,
		borderStyle: 'solid',
		borderColor: { 'default': strokeColor('light'), 'hover': palettes.hoverBorder, 'focus-visible': highlight },
		borderRadius: { 'default': palettes.borderRadius, 'focus-visible': borderRadius('medium') },
		backgroundColor: palettes.hoverBackground,
		outlineStyle: { 'focus-visible': 'none' },
		boxShadow: { 'focus-visible': halo },
		...font('c1'),
	});

	// Over the base, and under the hover and focus states the base already carries
	const mine = {
		true: {
			color: palettes.color,
			borderColor: { 'default': palettes.border, 'hover': palettes.hoverBorder, 'focus-visible': highlight },
			backgroundColor: { default: palettes.background, hover: palettes.hoverBackground },
		},
	};

	return [constant('messageReactionFrame', frame), constant('messageReactionMine', mine)].join('\n\n');
};

const generateMessageReactionCounter = () =>
	constant('messageReactionCounterFrame', leanText({ render: 'div', display: 'block', marginInline: offScale(2) }));

const generateStyles = () => `/* Component-scoped custom property inputs a frame value reads: the size of the emoji box inside a reaction */
.rcx-message-reactions__reaction {
	--emoji-size: ${size('x14')};
}

/* The add-reaction action is revealed like the toolbar: one rule set for the row's hover and focus */
${messageReveal('.rcx-message-reactions__reaction--action')}`;

const targets: Target[] = [
	{ file: component('MessageReactions.tsx'), generate: generateMessageReactions },
	{ file: component('MessageReaction.tsx'), generate: generateMessageReaction },
	{ file: component('MessageReactionCounter.tsx'), generate: generateMessageReactionCounter },
	{ file: component('MessageReactions.styles.css'), generate: generateStyles, css: true },
];

export default targets;
