import { useUserDisplayName } from '@rocket.chat/ui-client';
import { useUser, useUserAvatarPath } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

export type MediaCallViewer = {
	displayName: string;
	avatarUrl: string;
};

/** The person looking at the call, as the two things a view has to draw of them. */
export const useMediaCallViewer = (): MediaCallViewer => {
	const user = useUser();
	const displayName = useUserDisplayName({ name: user?.name, username: user?.username });
	const getUserAvatarPath = useUserAvatarPath();

	return useMemo(
		() => ({
			displayName: displayName || '',
			avatarUrl: getUserAvatarPath({ userId: user?._id || '' }),
		}),
		[displayName, getUserAvatarPath, user?._id],
	);
};
