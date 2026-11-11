import { clientCallbacks } from '@rocket.chat/ui-client';
import { useEndpoint, useSetting } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';

import { useFireGlobalEvent } from './useFireGlobalEvent';
import { userStatuses } from '../lib/userStatuses';
import type { UserStatusDescriptor } from '../lib/userStatuses';

export const useSetUserStatus = () => {
	const allowUserStatusMessageChange = useSetting('Accounts_AllowUserStatusMessageChange', true);
	const fireGlobalStatusEvent = useFireGlobalEvent('user-status-manually-set');
	const setStatus = useEndpoint('POST', '/v1/users.setStatus');

	return useMutation({
		mutationFn: async (status: UserStatusDescriptor) => {
			const request = setStatus({
				status: status.statusType,
				...(allowUserStatusMessageChange && { message: userStatuses.isValidType(status.id) ? '' : status.name }),
			});
			void clientCallbacks.run('userStatusManuallySet', status);
			await Promise.all([request, fireGlobalStatusEvent.mutateAsync(status)]);
		},
	});
};
