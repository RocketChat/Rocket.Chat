import { useTooltipClose, useTooltipOpen, useUserPresence } from '@rocket.chat/ui-contexts';
import type { MouseEvent } from 'react';
import { useCallback, useMemo } from 'react';

import { UserStatusText } from '../components/UserStatusText';

type UserStatusTooltipHandlers = {
	onMouseEnter: (e: MouseEvent<HTMLElement>) => void;
	onMouseLeave: () => void;
};

export function useUserStatusTooltip(uid: string | undefined, title: string): UserStatusTooltipHandlers {
	const presence = useUserPresence(uid);

	const openTooltip = useTooltipOpen();
	const closeTooltip = useTooltipClose();

	const onMouseEnter = useCallback(
		(e: MouseEvent<HTMLElement>) => {
			const target = e.currentTarget;

			if (!uid) {
				return openTooltip(title, target);
			}

			openTooltip(
				<UserStatusText status={presence?.status} statusText={presence?.statusText} statusExpiresAt={presence?.statusExpiresAt} />,
				target,
			);
		},
		[uid, openTooltip, presence, title],
	);

	return useMemo(() => ({ 'data-tooltip': '', onMouseEnter, 'onMouseLeave': closeTooltip }), [onMouseEnter, closeTooltip]);
}
