import { css } from '@rocket.chat/css-in-js';
import { Box, Icon } from '@rocket.chat/fuselage';
import type { Keys as IconName } from '@rocket.chat/icons';
import { useUserPreference } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';

import Emoji from '../../../../components/Emoji';

// A fixed-size leading slot that holds both the group icon and the collapse chevron as overlaid layers.
// The slot never changes size, so swapping icon↔chevron on hover causes no layout shift (no 1px jump).
// Sized to the title's line-height (1rem) so the icon reads in proportion to the small 0.75rem title.
const slotClass = css`
	position: relative;
	display: inline-flex;
	flex-shrink: 0;
	inline-size: 1rem;
	block-size: 1rem;
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

// When the category icon is hidden, the chevron takes its place and stays visible (it's the only collapse cue).
const chevronStaticClass = css`
	position: absolute;
	inset: 0;
	display: flex;
	align-items: center;
	justify-content: center;
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
}): ReactElement => {
	// The "Category icons" display option hides the leading icon/emoji; the collapse chevron stays in the slot.
	const showIcons = useUserPreference<boolean>('sidebarShowCategoryIcons', true);

	const nameNode = (
		<Box
			is='span'
			style={{
				fontWeight: unread ? 500 : 400,
				color: unread ? 'var(--rcx-color-font-titles-labels)' : undefined,
				verticalAlign: 'middle',
			}}
		>
			{name}
		</Box>
	);

	if (!showIcons) {
		return (
			<>
				<Box is='span' className={slotClass}>
					<Box is='span' className={chevronStaticClass}>
						<Icon name='chevron-down' size='x16' style={{ transform: collapsed ? 'rotate(-90deg)' : undefined }} />
					</Box>
				</Box>
				{nameNode}
			</>
		);
	}

	return (
		<>
			<Box is='span' className={slotClass}>
				<Box is='span' className={iconLayerClass}>
					{emoji ? (
						// Emojis read visually larger than a line icon at the same box size, so render them a touch
						// smaller than the x16 folder/type icon to match.
						<Box
							is='span'
							display='flex'
							alignItems='center'
							justifyContent='center'
							style={{ inlineSize: '0.875rem', blockSize: '0.875rem' }}
						>
							<Emoji emojiHandle={`:${emoji}:`} fillContainer />
						</Box>
					) : (
						<Icon name={iconName} size='x16' />
					)}
				</Box>
				<Box is='span' className={chevronLayerClass}>
					<Icon name='chevron-down' size='x16' style={{ transform: collapsed ? 'rotate(-90deg)' : undefined }} />
				</Box>
			</Box>
			{nameNode}
		</>
	);
};

export default CategoryLabel;
