import { Box, Divider } from '@rocket.chat/fuselage';
import { usePermission, useSetting } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import RoomListFiltersItem from './RoomListFiltersItem';
import { useHasLicenseModule } from '../../hooks/useHasLicenseModule';
import { OMNICHANNEL_GROUPS, sidePanelFiltersConfig } from '../../views/navigation/contexts/RoomsNavigationContext';

const OmnichannelFilters = () => {
	const { t } = useTranslation();
	const hasModule = useHasLicenseModule('livechat-enterprise');
	const hasAccess = usePermission('view-l-room');
	const canViewOmnichannelQueue = usePermission('view-livechat-queue');
	const queueEnabled = useSetting('Livechat_waiting_queue');

	if (!hasAccess) {
		return null;
	}

	return (
		<>
			<Box role='tablist' aria-label={t('Omnichannel_filters')} aria-orientation='vertical'>
				<RoomListFiltersItem group={OMNICHANNEL_GROUPS.IN_PROGRESS} icon={sidePanelFiltersConfig[OMNICHANNEL_GROUPS.IN_PROGRESS].icon} />
				{hasModule && queueEnabled && canViewOmnichannelQueue && (
					<RoomListFiltersItem group={OMNICHANNEL_GROUPS.QUEUE} icon={sidePanelFiltersConfig[OMNICHANNEL_GROUPS.QUEUE].icon} />
				)}
				{hasModule && (
					<RoomListFiltersItem group={OMNICHANNEL_GROUPS.ON_HOLD} icon={sidePanelFiltersConfig[OMNICHANNEL_GROUPS.ON_HOLD].icon} />
				)}
			</Box>
			<Divider borderColor='stroke-light' mb={4} mi={16} />
		</>
	);
};

export default OmnichannelFilters;
