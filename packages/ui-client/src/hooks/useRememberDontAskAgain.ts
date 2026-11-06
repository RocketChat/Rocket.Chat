import { useEndpoint, useUserPreference } from '@rocket.chat/ui-contexts';
import { useCallback } from 'react';

import type { DontAskAgainList } from './useDontAskAgain';

export type DontAskAgainEntry = { action: string; label: string };

/** Records that this reader does not want to be asked about something again. */
export const useRememberDontAskAgain = () => {
	const dontAskAgainList = useUserPreference<DontAskAgainList>('dontAskAgainList');
	const saveUserPreferences = useEndpoint('POST', '/v1/users.setPreferences');

	return useCallback(
		async ({ action, label }: DontAskAgainEntry): Promise<void> => {
			await saveUserPreferences({ data: { dontAskAgainList: [...(dontAskAgainList || []), { action, label }] } });
		},
		[dontAskAgainList, saveUserPreferences],
	);
};
