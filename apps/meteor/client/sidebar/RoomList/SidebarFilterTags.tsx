import { Box } from '@rocket.chat/fuselage';
import type { Keys as IconName } from '@rocket.chat/icons';
import { useUserPreference } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import SidebarConfigMenu from './SidebarConfigMenu';
import SidebarFilterPill from './SidebarFilterPill';
import { useRoomListFilter } from '../contexts/RoomListFilterContext';
import type { SidebarRoomListFilter } from '../hooks/useRoomList';
import { useSidebarFilterCounts } from '../hooks/useSidebarFilterCounts';

/**
 * Single-select filter pills at the top of the sidebar (Apple-Mail-style): each pill shows only its icon when
 * unselected and expands (filling the row) to icon + label + count when selected, with a per-filter accent
 * color. There is no explicit "All" pill — no pill selected means "all", and clicking the active pill again
 * returns to it. Filters stay visible even at 0 items; "Unreads"/"Mentions" are only hidden when their dynamic
 * category is the active grouping (the pill would be redundant). The config menu shares the row on the right.
 */
const SidebarFilterTags = () => {
	const { t } = useTranslation();
	const { filter, setFilter } = useRoomListFilter();
	const { drafts, unreads, mentions } = useSidebarFilterCounts();
	const dynamicCategory = useUserPreference<'none' | 'mention' | 'unreads'>('sidebarDynamicCategory', 'none');

	const showUnreads = dynamicCategory !== 'unreads';
	const showMentions = dynamicCategory !== 'mention';

	// If the active filter's pill was hidden (its dynamic category became the active grouping), fall back to "All".
	useEffect(() => {
		if ((filter === 'unreads' && !showUnreads) || (filter === 'mentions' && !showMentions)) {
			setFilter('all');
		}
	}, [filter, showUnreads, showMentions, setFilter]);

	// Clicking the active pill returns to "All". Each filter gets its own selected accent color.
	const renderPill = (
		key: SidebarRoomListFilter,
		icon: IconName,
		label: string,
		color: 'neutral' | 'primary' | 'danger' | 'light',
		count?: number,
	) => (
		<SidebarFilterPill
			icon={icon}
			label={label}
			count={count}
			color={color}
			selected={filter === key}
			onClick={() => setFilter(filter === key ? 'all' : key)}
		/>
	);

	return (
		<Box display='flex' alignItems='flex-start' pi={12} pbs={12} pbe={8} style={{ gap: '0.5rem' }}>
			<Box is='nav' aria-label={t('Filter')} display='flex' flexWrap='nowrap' flexGrow={1} minWidth={0} style={{ gap: '0.5rem' }}>
				{showUnreads && renderPill('unreads', 'flag', t('Unreads'), 'primary', unreads)}
				{showMentions && renderPill('mentions', 'at', t('Mentions'), 'danger', mentions)}
				{renderPill('drafts', 'pencil', t('Drafts'), 'light', drafts)}
			</Box>
			<SidebarConfigMenu />
		</Box>
	);
};

export default SidebarFilterTags;
