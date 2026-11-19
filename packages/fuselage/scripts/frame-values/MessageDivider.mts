import { join } from 'node:path';

import { constant, textPart, viewPart } from './lib/messageFrames.mts';
import type { Target } from './lib/target.mts';
import { fontScale, space, themed, zIndex } from './lib/tokens.mts';

const generate = () =>
	[
		constant(
			'messageDividerFrame',
			viewPart({
				position: 'relative',
				zIndex: zIndex('raised'),
				flexDirection: 'row',
				alignItems: 'center',
				// The line overlaps the edge of the message below it
				marginBottom: -1,
				paddingInline: space('x20'),
			}),
		),
		// Equal bars keep the date centred, whatever room the unread label takes from its bar
		constant('messageDividerBar', viewPart({ flexDirection: 'row', alignItems: 'center', flexGrow: 1, flexBasis: 0, minWidth: 0 })),
		constant(
			'messageDividerWrapper',
			textPart({
				display: 'block',
				marginBlock: space('x8'),
				paddingInline: space('x8'),
				color: themed('font-default'),
				...fontScale('c2'),
			}),
		),
		constant(
			'messageDividerUnreadLabel',
			textPart({
				display: 'block',
				order: 1,
				// Takes no block size, so a divider with only this label stays a line that the label overhangs
				marginBlock: -8,
				paddingInlineStart: space('x8'),
				color: themed('font-danger'),
				...fontScale('c2'),
			}),
		),
	].join('\n');

export default [
	{ file: join(import.meta.dirname, '../../src/components/Message/MessageDivider/MessageDivider.tsx'), generate },
] satisfies Target[];
