import { useState } from 'react';

import OutlookEventsList from './OutlookEventsList';
import OutlookSettingsList from './OutlookSettingsList';
import { useRoomToolbox } from '../room/contexts/RoomToolboxContext';

type OutlookCalendarRoutes = 'list' | 'settings';

const CALENDAR_ROUTES: { [key: string]: OutlookCalendarRoutes } = {
	LIST: 'list',
	SETTINGS: 'settings',
};

const OutlookEventsRoute = () => {
	const { closeTab } = useRoomToolbox();
	const [calendarRoute, setCalendarRoute] = useState<OutlookCalendarRoutes>('list');

	if (calendarRoute === CALENDAR_ROUTES.SETTINGS) {
		return <OutlookSettingsList onClose={closeTab} changeRoute={() => setCalendarRoute(CALENDAR_ROUTES.LIST)} />;
	}

	return <OutlookEventsList onClose={closeTab} changeRoute={() => setCalendarRoute(CALENDAR_ROUTES.SETTINGS)} />;
};

export default OutlookEventsRoute;
