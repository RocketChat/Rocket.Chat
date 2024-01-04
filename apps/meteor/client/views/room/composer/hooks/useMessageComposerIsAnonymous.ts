import { useSetting, useUserId } from '@rocket.chat/ui-contexts';

export const useMessageComposerIsAnonymous = (): boolean => {
	const isAnonymousReadEnabled = useSetting('Accounts_AllowAnonymousRead');
	const isAnonymousWriteEnabled = useSetting('Accounts_AllowAnonymousWrite');

	const uid = useUserId();

	if (!uid && !isAnonymousReadEnabled && !isAnonymousWriteEnabled) {
		throw new Error('Anonymous access is disabled');
	}
	return Boolean(!uid);
};
