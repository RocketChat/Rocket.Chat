import { useUserPreference, useSetting } from '@rocket.chat/ui-contexts';
import type { MomentInput } from 'moment';
import moment from 'moment';
import { useCallback } from 'react';

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
