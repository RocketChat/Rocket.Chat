import { Box } from '@rocket.chat/fuselage';
import { useSetting } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import RoomListFiltersItem from './RoomListFiltersItem';
import { sidePanelFiltersConfig } from '../../views/navigation/contexts/RoomsNavigationContext';

const TeamCollabFilters = () => {
	const { t } = useTranslation();
	const isDiscussionEnabled = useSetting('Discussion_enabled');

	return (
		<Box role='tablist' aria-label={t('Team_collaboration_filters')} aria-orientation='vertical' mbs={8}>
			<RoomListFiltersItem group='all' icon={sidePanelFiltersConfig.all.icon} />
			<RoomListFiltersItem group='favorites' icon={sidePanelFiltersConfig.favorites.icon} />
			{isDiscussionEnabled && <RoomListFiltersItem group='discussions' icon={sidePanelFiltersConfig.discussions.icon} />}
		</Box>
	);
};

export default TeamCollabFilters;
