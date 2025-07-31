import { Box } from '@rocket.chat/fuselage';
import { useSetting } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import RoomListFiltersItem from './RoomListFiltersItem';
import { sidePanelFiltersConfig, TEAM_COLLAB_GROUPS } from '../../views/navigation/contexts/RoomsNavigationContext';

const TeamCollabFilters = () => {
	const { t } = useTranslation();
	const isDiscussionEnabled = useSetting('Discussion_enabled');

	return (
		<Box role='tablist' aria-label={t('Team_collaboration_filters')} aria-orientation='vertical' mbs={8}>
			<RoomListFiltersItem group={TEAM_COLLAB_GROUPS.ALL} icon={sidePanelFiltersConfig[TEAM_COLLAB_GROUPS.ALL].icon} />
			<RoomListFiltersItem group={TEAM_COLLAB_GROUPS.MENTIONS} icon={sidePanelFiltersConfig[TEAM_COLLAB_GROUPS.MENTIONS].icon} />
			<RoomListFiltersItem group={TEAM_COLLAB_GROUPS.FAVORITES} icon={sidePanelFiltersConfig[TEAM_COLLAB_GROUPS.FAVORITES].icon} />
			{isDiscussionEnabled && (
				<RoomListFiltersItem group={TEAM_COLLAB_GROUPS.DISCUSSIONS} icon={sidePanelFiltersConfig[TEAM_COLLAB_GROUPS.DISCUSSIONS].icon} />
			)}
		</Box>
	);
};

export default TeamCollabFilters;
