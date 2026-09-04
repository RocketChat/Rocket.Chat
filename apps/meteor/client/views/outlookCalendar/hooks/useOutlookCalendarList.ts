import { useToastMessageDispatch, useTranslation, useEndpoint, useSetting } from '@rocket.chat/ui-contexts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useOutlookAuthenticationMutation } from './useOutlookAuthentication';
import { getEndpointErrorMessage } from '../../../lib/errorHandling';
import { syncOutlookEvents } from '../lib/syncOutlookEvents';

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
	const t = useTranslation();
	const queryClient = useQueryClient();

	const isServerManaged = useSetting('Outlook_Calendar_Mode', 'legacy') === 'server';
	const syncMyCalendar = useEndpoint('POST', '/v1/exchange.syncMyCalendar');

	const checkOutlookCredentials = useOutlookAuthenticationMutation();

	const dispatchToastMessage = useToastMessageDispatch();

	const syncMutation = useMutation({
		mutationFn: async () => {
			if (isServerManaged) {
				await syncMyCalendar();
			} else {
				await syncOutlookEvents();
			}

			await queryClient.invalidateQueries({
				queryKey: ['outlook', 'calendar', 'list'],
			});

			if (!isServerManaged) {
				await checkOutlookCredentials.mutateAsync();
			}
		},
		onSuccess: () => {
			dispatchToastMessage({ type: 'success', message: t('Outlook_Sync_Success') });
		},
		onError: async (error) => {
			if (error instanceof Error && error.message === 'abort') {
				return;
			}

			dispatchToastMessage({ type: 'error', message: await getEndpointErrorMessage(error, 'Outlook_Sync_Failed') });
		},
	});
	return syncMutation;
};
