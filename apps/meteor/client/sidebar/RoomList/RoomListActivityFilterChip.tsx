import { css } from '@rocket.chat/css-in-js';
import { Icon, Tag, useStyle } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import { useActivityFilterLabel, useActivityFilterWindowLabel } from '../categories/hooks/useActivityFilterItems';

type RoomListActivityFilterChipProps = {
	activityFilterHours: number;
	inactiveCount: number;
	/** False while the user has lifted the filter for this session to see every room. */
	applied: boolean;
	onToggle: () => void;
};

// At rest only the clock is seen; the window shows while the pointer, the keyboard focus or the open kebab menu is
// on the group header, the way the kebab itself reveals. (The toggle's own `aria-expanded` must not count.)
const revealWindowOnHeaderHover = css`
	.rcx-sidebar-collapse-group__bar:not(:hover, :focus-within, :has(.rcx-sidebar-collapse-group__menu-wrapper [aria-expanded='true']))
		&
		.rcx-tag__inner {
		display: none;
	}
`;

/**
 * Says that an expanded group is filtered and by which window, and lifts the filter for the session, or puts it
 * back. While the filter hides nothing there is nothing to lift, so the chip stays as a sign only.
 */
const RoomListActivityFilterChip = ({ activityFilterHours, inactiveCount, applied, onToggle }: RoomListActivityFilterChipProps) => {
	const { t } = useTranslation();
	const revealClassName = useStyle(revealWindowOnHeaderHover);
	// The visible window opens the accessible name, so a speech user can say what they see; the menu's full name follows.
	const windowLabel = useActivityFilterWindowLabel(activityFilterHours);
	const filterLabel = useActivityFilterLabel(activityFilterHours);
	const nothingHidden = inactiveCount === 0;

	const title = (() => {
		if (nothingHidden) {
			return t('No_inactive_rooms_hidden');
		}
		return applied ? t('Show_inactive', { count: inactiveCount }) : t('Hide_inactive');
	})();

	// The group's `actions` slot keeps a press on the chip from collapsing or expanding the group.
	return (
		<Tag
			is='button'
			pill
			className={revealClassName}
			variant={applied ? 'secondary-info' : 'secondary'}
			disabled={nothingHidden}
			icon={<Icon name='clock' size='x12' />}
			aria-label={t('Activity_filter_label', { window: windowLabel, filter: filterLabel })}
			aria-pressed={applied}
			title={title}
			onClick={onToggle}
		>
			{windowLabel}
		</Tag>
	);
};

export default RoomListActivityFilterChip;
