import moment, { MomentInput } from 'moment';
import { useCallback } from 'react';

import { useSetting } from '../contexts/SettingsContext';
import { useUserPreference } from '../contexts/UserContext';

type UseFormatDateAndTimeParams = {
	withSeconds?: boolean;
};

export const useFormatDateAndTime = ({ withSeconds }: UseFormatDateAndTimeParams = {}): ((input: MomentInput) => string) => {
	const clockMode = useUserPreference('clockMode');
	const format = useSetting('Message_TimeAndDateFormat') as string;

	return useCallback(
		(time) => {
			switch (clockMode) {
				case 1:
					return moment(time).format(withSeconds ? 'MMMM D, Y h:mm:ss A' : 'MMMM D, Y h:mm A');
				case 2:
					return moment(time).format(withSeconds ? 'MMMM D, Y H:mm:ss' : 'MMMM D, Y H:mm');

				default:
					return moment(time).format(withSeconds ? 'L LTS' : format);
			}
		},
		[clockMode, format, withSeconds],
	);
};
