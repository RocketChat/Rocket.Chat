import { useSetting, useUser } from '@rocket.chat/ui-contexts';
import { lazy, useMemo } from 'react';

import type { RoomToolboxActionConfig } from '../../views/room/contexts/RoomToolboxContext';

const OutlookEventsRoute = lazy(() => import('../../views/outlookCalendar/OutlookEventsRoute'));

export const useOutlookCalenderRoomAction = () => {
	const user = useUser();
	const enabledDefault = useSetting('Outlook_Calendar_Enabled', false);
	const mapping = useSetting('Outlook_Calendar_Url_Mapping', '{}');
	const domain = user?.email?.split('@')?.pop() ?? '';
	const mappingParsed = JSON.parse(mapping) as Record<
		string,
		{
			Enabled?: boolean;
			Exchange_Url?: string;
			Outlook_Url?: string;
			MeetingUrl_Regex?: string;
			BusyStatus_Enabled?: string;
		}
	>;

	const enabledForDomain = mappingParsed[domain]?.Enabled ?? enabledDefault;

	return useMemo((): RoomToolboxActionConfig | undefined => {
		if (!enabledForDomain) {
			return undefined;
		}

		return {
			id: 'outlookCalendar',
			groups: ['channel', 'group', 'team'],
			icon: 'calendar',
			title: 'Outlook_calendar',
			tabComponent: OutlookEventsRoute,
			order: 999,
		};
	}, [enabledForDomain]);
};
