import { useToastMessageDispatch, useEndpoint } from '@rocket.chat/ui-contexts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { getErrorMessage } from '../../../lib/errorHandling';

export const useOutlookCalendarListForToday = () => {
	return useOutlookCalendarList(new Date());
};

export const useOutlookCalendarList = (date: Date) => {
	const calendarData = useEndpoint('GET', '/v1/calendar-events.list');

	return useQuery({
		queryKey: ['outlook', 'calendar', 'list'],

		queryFn: async () => {
			const { data } = await calendarData({ date: date.toISOString() });
			return data;
		},
	});
};

export const useMutationOutlookCalendarSync = () => {
	const { t } = useTranslation();
	const queryClient = useQueryClient();

	const syncMyCalendar = useEndpoint('POST', '/v1/exchange.syncMyCalendar');

	const dispatchToastMessage = useToastMessageDispatch();

	return useMutation({
		mutationFn: async () => {
			await syncMyCalendar();

			await queryClient.invalidateQueries({
				queryKey: ['outlook', 'calendar', 'list'],
			});
		},
		onSuccess: () => {
			dispatchToastMessage({ type: 'success', message: t('Outlook_Sync_Success') });
		},
		onError: (error) => {
			dispatchToastMessage({ type: 'error', message: getErrorMessage(error, 'Outlook_Sync_Failed') });
		},
	});
};
