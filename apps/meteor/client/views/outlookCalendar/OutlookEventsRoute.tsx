import React, { useState } from 'react';

import { useRoomToolbox } from '../room/contexts/RoomToolboxContext';
import OutlookEventsList from './OutlookEventsList';
import OutlookSettingsList from './OutlookSettingsList';

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
