import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import { useEndpoint, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useQueryClient } from '@tanstack/react-query';

import { managedPresenceQueryKeys } from '../../../lib/queryKeys';

type UserPresenceRules = {
	presenceEnabled: boolean;
	hiddenFrom: string[];
	statusText?: string;
};

export const useApplyUserPresenceRules = () => {
	const dispatchToastMessage = useToastMessageDispatch();
	const queryClient = useQueryClient();
	const updateUser = useEndpoint('POST', '/v1/users.update');

	return useStableCallback(
		async (userId: string, { presenceEnabled, hiddenFrom, statusText }: UserPresenceRules, successMessage: string) => {
			try {
				await updateUser({
					userId,
					data: {
						presenceDisabledByAdmin: !presenceEnabled,
						statusVisibilityDeniedByAdmin: hiddenFrom,
						...(statusText !== undefined && { statusText }),
					},
				});

				queryClient.invalidateQueries({ queryKey: managedPresenceQueryKeys.all });
				dispatchToastMessage({ type: 'success', message: successMessage });

				return true;
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });

				return false;
			}
		},
	);
};
