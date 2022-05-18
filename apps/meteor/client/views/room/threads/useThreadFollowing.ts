import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useToastMessageDispatch, useUserId, useMethod } from '@rocket.chat/ui-contexts';

import { useThreadMessage } from './useThreadMessage';

export const useThreadFollowing = (mid: string): [following: boolean, toggle: () => void] => {
	const uid = useUserId();
	const { data: threadMessage } = useThreadMessage(mid);
	const dispatchToastMessage = useToastMessageDispatch();
	const followMessage = useMethod('followMessage');
	const unfollowMessage = useMethod('unfollowMessage');

	const following = !uid ? false : threadMessage?.replies?.includes(uid) ?? false;

	const toggleFollowing = useMutableCallback(async () => {
		try {
			if (!following) {
				await followMessage({ mid });
				return;
			}

			await unfollowMessage({ mid });
		} catch (error) {
			dispatchToastMessage({
				type: 'error',
				message: error,
			});
		}
	});

	return [following, toggleFollowing];
};
