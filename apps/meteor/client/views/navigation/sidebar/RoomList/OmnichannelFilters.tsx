import { Box, Divider } from '@rocket.chat/fuselage';
import { usePermission } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import RoomListFiltersItem from './RoomListFiltersItem';
import { sidePanelFiltersConfig } from '../../contexts/RoomsNavigationContext';

const OmnichannelFilters = () => {
	const { t } = useTranslation();
	const hasAccess = usePermission('view-l-room');
	const canViewOmnichannelQueue = usePermission('view-livechat-queue');

	if (!hasAccess) {
		return null;
	}

	return (
		<>
			<Box role='tablist' aria-label={t('Omnichannel_filters')} aria-orientation='vertical'>
				<RoomListFiltersItem group='inProgress' icon={sidePanelFiltersConfig.inProgress.icon} />
				{canViewOmnichannelQueue && <RoomListFiltersItem group='queue' icon={sidePanelFiltersConfig.queue.icon} />}
				<RoomListFiltersItem group='onHold' icon={sidePanelFiltersConfig.onHold.icon} />
			</Box>
			<Divider borderColor='stroke-light' mb={4} mi={16} />
		</>
	);
};

export default OmnichannelFilters;
