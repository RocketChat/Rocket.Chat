import type { SidebarCategoryActivityFilter } from '@rocket.chat/core-typings';
import { css } from '@rocket.chat/css-in-js';
import { Box, Icon, Palette, Tag } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import { usePreventPropagation } from '../../hooks/usePreventPropagation';
import { getActivityFilterLabel, useActivityFilterWindowLabel } from '../categories/hooks/useActivityFilterItems';

const chipStyle = css`
	--rcx-tag-border-radius: 9999px;

	display: flex;
	flex-shrink: 0;
	align-items: center;
	cursor: pointer;
	border-radius: 9999px;
	background: none;

	&:focus-visible {
		outline: 1px solid ${Palette.stroke['stroke-highlight']};
		outline-offset: 1px;
	}
`;

type RoomListActivityFilterChipProps = {
	activityFilter: SidebarCategoryActivityFilter;
	inactiveCount: number;
	/** False while the user has lifted the filter for this session to see every room. */
	applied: boolean;
	onToggle: () => void;
};

/** Says why an expanded group lists fewer rooms, and lifts the filter for the session, or puts it back. */
const RoomListActivityFilterChip = ({ activityFilter, inactiveCount, applied, onToggle }: RoomListActivityFilterChipProps) => {
	const { t } = useTranslation();
	const windowLabel = useActivityFilterWindowLabel(activityFilter);
	// Pressing the chip must not also collapse or expand the group.
	const handleClick = usePreventPropagation(onToggle);
	const preventPropagation = usePreventPropagation();

	return (
		<Box
			is='button'
			type='button'
			className={chipStyle}
			aria-label={`${t('Filter')}: ${t(getActivityFilterLabel(activityFilter))}`}
			aria-pressed={applied}
			title={applied ? t('Show_inactive', { count: inactiveCount }) : t('Hide_inactive')}
			onClick={handleClick}
			onKeyDown={preventPropagation}
		>
			<Tag variant={applied ? 'secondary-info' : 'secondary'} icon={<Icon name='clock' size='x12' marginInlineEnd={4} />}>
				{windowLabel}
			</Tag>
		</Box>
	);
};

export default RoomListActivityFilterChip;
