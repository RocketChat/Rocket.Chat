import { guessTimezone, guessTimezoneFromOffset } from '@rocket.chat/tools';

import { settings } from '../../../settings/server';

export const getTimezone = (user?: { utcOffset?: string | number } | null): string => {
	const timezone = settings.get('Default_Timezone_For_Reporting');

	switch (timezone) {
		case 'custom':
			return settings.get<string>('Default_Custom_Timezone');
		case 'user':
			return user?.utcOffset != null ? guessTimezoneFromOffset(user.utcOffset) : guessTimezone();
		default:
			return guessTimezone();
	}
};
