import { useToastMessageDispatch, useTranslation } from '@rocket.chat/ui-contexts';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useOutlookAuthenticationMutation } from './useOutlookAuthentication';
import { useCalendarList, useCalendarListForToday } from '../../calendar/hooks/useCalendarList';
import { syncOutlookEvents } from '../lib/syncOutlookEvents';

/**
 * @deprecated Use {@link useCalendarListForToday} from `views/calendar/hooks/useCalendarList` directly.
 * Kept for backward compatibility with existing Outlook calendar views.
 */
export const useOutlookCalendarListForToday = () => {
	return useCalendarListForToday();
};

/**
 * @deprecated Use {@link useCalendarList} from `views/calendar/hooks/useCalendarList` directly.
 * Kept for backward compatibility with existing Outlook calendar views.
 */
export const useOutlookCalendarList = (date: Date) => {
	return useCalendarList(date);
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
				queryKey: ['calendar', 'list'],
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
