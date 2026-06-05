import { useTooltipClose, useTooltipOpen, useUserPresence } from '@rocket.chat/ui-contexts';
import type { MouseEvent } from 'react';
import { useCallback, useMemo } from 'react';

import { UserStatusText } from '../components/UserStatusText';

type UserStatusTooltipHandlers = {
	onMouseEnter: (e: MouseEvent<HTMLElement>) => void;
	onMouseLeave: () => void;
};

export function useUserStatusTooltip(uid: string | undefined): UserStatusTooltipHandlers {
	const presence = useUserPresence(uid);

	const openTooltip = useTooltipOpen();
	const closeTooltip = useTooltipClose();

	const tooltipNode = useMemo(() => {
		if (!uid) {
			return null;
		}
		return <UserStatusText status={presence?.status} statusText={presence?.statusText} statusExpiresAt={presence?.statusExpiresAt} />;
	}, [uid, presence?.status, presence?.statusText, presence?.statusExpiresAt]);

	const onMouseEnter = useCallback(
		(e: MouseEvent<HTMLElement>) => {
			if (!tooltipNode) {
				return;
			}

			// TODO: Workaround - need to find a proper way to display the tooltip
			// when it's more than simple string
			const target = e.currentTarget;
			setTimeout(() => openTooltip(tooltipNode, target), 0);
		},
		[tooltipNode, openTooltip],
	);

	return { onMouseEnter, onMouseLeave: closeTooltip };
}
