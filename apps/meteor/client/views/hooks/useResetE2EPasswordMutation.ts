import { useLogout, useEndpoint, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import type { MutationOptions } from '@tanstack/react-query';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { createLogger } from '../../lib/e2ee/logger';
import { e2eSearchIndexRuntime } from '../../lib/e2ee/rocketchat.e2e';

const log = createLogger('E2E');

export const useResetE2EPasswordMutation = ({ options }: { options?: MutationOptions } = {}) => {
	const { t } = useTranslation();

	const logout = useLogout();
	const resetE2eKey = useEndpoint('POST', '/v1/users.resetE2EKey');
	const dispatchToastMessage = useToastMessageDispatch();

	return useMutation({
		mutationFn: async () => {
			// The new key cannot read the old messages, and the local search index must not keep them. The wipe runs before
			// the reset, because the server logs out every session of the user (`user.forceLogout`) before it answers, and
			// the index closes at the logout. A failed reset loses only the index, which the crawler fills again.
			try {
				await e2eSearchIndexRuntime.wipe();
			} catch (error) {
				log.span('searchIndex').error('Error wiping the local search index before the E2E key reset', error);
			}
			return resetE2eKey({});
		},
		onSuccess: () => {
			dispatchToastMessage({ type: 'success', message: t('E2EE_password_reset') });
			logout();
		},
		onError: (error) => {
			dispatchToastMessage({ type: 'error', message: error });
		},
		...options,
	});
};
