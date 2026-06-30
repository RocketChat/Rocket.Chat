import { Skeleton } from '@rocket.chat/fuselage';
import { UserPresenceContext, useTooltipClose, useTooltipOpen, useUserPresence } from '@rocket.chat/ui-contexts';
import type { MouseEvent } from 'react';
import { useCallback, useContext, useMemo } from 'react';

import { UserStatusText } from '../components/UserStatusText';

const UserStatusTooltipContent = ({ uid }: { uid: string }) => {
	const presence = useUserPresence(uid);

	if (!presence) {
		return <Skeleton width='x200' variant='text' backgroundColor='surface-light' />;
	}

	return <UserStatusText status={presence.status} statusText={presence.statusText} statusExpiresAt={presence.statusExpiresAt} />;
};

export function useUserStatusTooltip(uid: string | undefined, title?: string) {
	const userPresence = useContext(UserPresenceContext);

	const openTooltip = useTooltipOpen();
	const closeTooltip = useTooltipClose();

	const onMouseEnter = useCallback(
		(e: MouseEvent<HTMLElement>) => {
			const target = e.currentTarget;

			if (!uid) {
				return openTooltip(title, target);
			}

			openTooltip(
				<UserPresenceContext.Provider value={userPresence}>
					<UserStatusTooltipContent uid={uid} />
				</UserPresenceContext.Provider>,
				target,
			);
		},
		[uid, openTooltip, title, userPresence],
	);

	return useMemo(() => ({ 'data-tooltip': '', onMouseEnter, 'onMouseLeave': closeTooltip }), [onMouseEnter, closeTooltip]);
}
