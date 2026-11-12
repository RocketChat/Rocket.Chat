import { join } from 'node:path';

import { font } from './lib/frameTokens.mts';
import { textFrame } from './lib/itemFrames.mts';
import { literal } from './lib/literal.mts';
import { messagePalettes } from './lib/messagePalettes.mts';
import type { Target } from './lib/target.mts';
import { zIndex } from './lib/tokens.mts';
import { webDefaults } from './lib/webDefaults.mts';
import { spacing } from '../../src/styleTokens.ts';

const component = (file: string) => join(import.meta.dirname, '../../src/components/Message/MessageDivider', file);

const { divider } = messagePalettes();

const generateMessageDivider = () => {
	// Overlays the top pixel of the row that follows, which is what the negative bottom margin leaves it
	const root = textFrame({
		render: 'div',
		position: 'relative',
		zIndex: zIndex.raised,
		display: 'flex',
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: divider.sizeNeg,
		paddingInline: spacing('x20'),
		color: divider.color,
		...font('c2'),
	});

	// Equal bars keep the date centred, whatever room the Unread label takes from its bar
	const bar = webDefaults({
		render: 'div',
		display: 'flex',
		flexDirection: 'row',
		alignItems: 'center',
		flexGrow: 1,
		flexShrink: 1,
		flexBasis: 0,
		minWidth: 0,
	});

	const wrapper = textFrame({ render: 'div', marginBlock: spacing('x8'), paddingInline: spacing('x8') });

	// Takes no block size, so a divider with only this label stays a 1px line that the label overhangs
	const unreadLabel = textFrame({
		render: 'div',
		order: 1,
		marginBlock: spacing('-x8'),
		paddingInlineStart: spacing('x8'),
		color: divider.colorUnread,
	});

	return [
		`const messageDividerFrame = ${literal(root)} as const;`,
		`const messageDividerBar = ${literal(bar)} as const;`,
		`const messageDividerWrapper = ${literal(wrapper)} as const;`,
		`const messageDividerUnreadLabel = ${literal(unreadLabel)} as const;`,
	].join('\n\n');
};

const generateMessageDividerCss = () => `.rcx-message-divider__bar::after {
	flex-grow: 1;

	height: ${divider.size};

	content: '';

	background: ${divider.background};
}

.rcx-message-divider__bar--unread::after {
	background: ${divider.backgroundUnread};
}`;

const targets: Target[] = [
	{ file: component('MessageDivider.tsx'), generate: generateMessageDivider },
	{ file: component('MessageDivider.styles.css'), generate: generateMessageDividerCss, css: true },
];

export default targets;
