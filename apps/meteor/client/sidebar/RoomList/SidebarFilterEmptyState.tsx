import { Box, States, StatesIcon, StatesTitle, StatesSubtitle } from '@rocket.chat/fuselage';
import type { Keys as IconName } from '@rocket.chat/icons';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import type { SidebarRoomListFilter } from '../hooks/useRoomList';

const CONTENT: Record<Exclude<SidebarRoomListFilter, 'all'>, { icon: IconName; title: TranslationKey; subtitle: TranslationKey }> = {
	unreads: { icon: 'flag', title: 'No_unread_messages', subtitle: 'No_unread_messages_description' },
	mentions: { icon: 'at', title: 'No_mentions', subtitle: 'No_mentions_filter_description' },
	drafts: { icon: 'pencil', title: 'No_drafts', subtitle: 'No_drafts_description' },
};

/**
 * Empty state shown in place of the room list when a filter is active but matches no rooms
 * (e.g. "Unreads" selected with nothing unread).
 */
const SidebarFilterEmptyState = ({ filter }: { filter: Exclude<SidebarRoomListFilter, 'all'> }) => {
	const { t } = useTranslation();
	const { icon, title, subtitle } = CONTENT[filter];

	return (
		<Box display='flex' alignItems='center' justifyContent='center' height='full' pi={16}>
			<States>
				<StatesIcon name={icon} />
				<StatesTitle>{t(title)}</StatesTitle>
				<StatesSubtitle>{t(subtitle)}</StatesSubtitle>
			</States>
		</Box>
	);
};

export default SidebarFilterEmptyState;
