import { css } from '@rocket.chat/css-in-js';
import { Box, Icon } from '@rocket.chat/fuselage';
import type { Keys as IconName } from '@rocket.chat/icons';
import type { ReactElement } from 'react';

import Emoji from '../../../../components/Emoji';

// A fixed-size leading slot that holds both the group icon and the collapse chevron as overlaid layers.
// The slot never changes size, so swapping icon↔chevron on hover causes no layout shift (no 1px jump).
const slotClass = css`
	position: relative;
	display: inline-flex;
	flex-shrink: 0;
	inline-size: 1.25rem;
	block-size: 1.25rem;
	margin-inline-end: 0.25rem;
	vertical-align: middle;
`;

const iconLayerClass = css`
	position: absolute;
	inset: 0;
	display: flex;
	align-items: center;
	justify-content: center;

	.rcx-sidebar-v2-collapse-group__bar:hover & {
		display: none;
	}
`;

const chevronLayerClass = css`
	position: absolute;
	inset: 0;
	display: none;
	align-items: center;
	justify-content: center;

	.rcx-sidebar-v2-collapse-group__bar:hover & {
		display: flex;
	}
`;

/**
 * A collapser header label: a leading icon followed by the name. The icon is the category emoji when set,
 * otherwise the given fuselage icon (folder for a custom category, the type icon for a system group). The
 * icon and the collapse chevron share one fixed slot — icon by default, chevron on hover — so custom and
 * system groups align identically and the title doesn't shift when hovered.
 */
const CategoryLabel = ({
	emoji,
	iconName,
	name,
	collapsed,
	unread = false,
}: {
	emoji?: string;
	iconName: IconName;
	name: string;
	collapsed: boolean;
	/** Match the title to the sidebar room items: regular weight + muted color normally, and the unread item's
	 * heavier weight + strong color when the group hides unread rooms (collapsed with "Show unreads" off). */
	unread?: boolean;
}): ReactElement => (
	<>
		<Box is='span' className={slotClass}>
			<Box is='span' className={iconLayerClass}>
				{emoji ? (
					// Emojis read visually larger than a line icon at the same box size, so render them a touch
					// smaller than the x20 folder/type icon to match.
					<Box
						is='span'
						display='flex'
						alignItems='center'
						justifyContent='center'
						style={{ inlineSize: '1.125rem', blockSize: '1.125rem' }}
					>
						<Emoji emojiHandle={`:${emoji}:`} fillContainer />
					</Box>
				) : (
					<Icon name={iconName} size='x20' />
				)}
			</Box>
			<Box is='span' className={chevronLayerClass}>
				<Icon name='chevron-down' size='x20' style={{ transform: collapsed ? 'rotate(-90deg)' : undefined }} />
			</Box>
		</Box>
		<Box is='span' style={{ fontWeight: unread ? 500 : 400, color: unread ? 'var(--rcx-color-font-titles-labels)' : undefined }}>
			{name}
		</Box>
	</>
);

export default CategoryLabel;
