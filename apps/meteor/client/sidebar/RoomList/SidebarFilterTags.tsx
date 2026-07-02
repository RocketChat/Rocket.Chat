import { Box, Tag } from '@rocket.chat/fuselage';
import { useUserPreference } from '@rocket.chat/ui-contexts';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { useRoomListFilter } from '../contexts/RoomListFilterContext';
import type { SidebarRoomListFilter } from '../hooks/useRoomList';
import { useSidebarFilterCounts } from '../hooks/useSidebarFilterCounts';

/**
 * Single-select filter tags at the top of the sidebar. "All" clears the filter; the others narrow the list to
 * their matching rooms (see `useRoomList`). "Unreads"/"Mentions" are hidden when their dynamic category is the
 * active grouping (it would be redundant), and every count-bearing tag is only shown when it has items.
 */
const SidebarFilterTags = () => {
	const { t } = useTranslation();
	const { filter, setFilter } = useRoomListFilter();
	const { drafts, unreads, mentions } = useSidebarFilterCounts();
	const dynamicCategory = useUserPreference<'none' | 'mention' | 'unreads'>('sidebarDynamicCategory', 'none');

	// Clicking the active tag returns to "All".
	const renderTag = (key: SidebarRoomListFilter, label: ReactNode) => (
		<Tag medium variant={filter === key ? 'primary' : 'secondary'} onClick={() => setFilter(filter === key ? 'all' : key)}>
			{label}
		</Tag>
	);

	return (
		<Box is='nav' aria-label={t('Filter')} display='flex' flexWrap='wrap' pi={12} pbs={12} pbe={8} style={{ gap: '0.5rem' }}>
			{renderTag('all', t('All'))}
			{dynamicCategory !== 'unreads' && unreads > 0 && renderTag('unreads', `${t('Unreads')} (${unreads})`)}
			{dynamicCategory !== 'mention' && mentions > 0 && renderTag('mentions', `${t('Mentions')} (${mentions})`)}
			{drafts > 0 && renderTag('drafts', `${t('Drafts')} (${drafts})`)}
		</Box>
	);
};

export default SidebarFilterTags;
