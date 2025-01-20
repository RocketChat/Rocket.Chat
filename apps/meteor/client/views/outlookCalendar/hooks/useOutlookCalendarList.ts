import { useToastMessageDispatch, useTranslation, useEndpoint } from '@rocket.chat/ui-contexts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useOutlookAuthenticationMutation } from './useOutlookAuthentication';
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

	const checkOutlookCredentials = useOutlookAuthenticationMutation();

	const dispatchToastMessage = useToastMessageDispatch();

	const syncMutation = useMutation({
		mutationFn: async () => {
			await syncOutlookEvents();

			await queryClient.invalidateQueries({
				queryKey: ['outlook', 'calendar', 'list'],
			});

			await checkOutlookCredentials.mutateAsync();
		},
		onSuccess: () => {
			dispatchToastMessage({ type: 'success', message: t('Outlook_Sync_Success') });
		},
		onError: (error) => {
			if (error instanceof Error && error.message === 'abort') {
				return;
			}
			dispatchToastMessage({ type: 'error', message: t('Outlook_Sync_Failed') });
		},
	});
	return syncMutation;
};
