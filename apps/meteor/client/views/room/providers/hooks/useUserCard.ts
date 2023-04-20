import type { UIEvent } from 'react';
import { useCallback, useEffect } from 'react';

import { openUserCard, closeUserCard } from '../../../../../app/ui/client/lib/userCard';
import { useTabBarOpenUserInfo } from '../../contexts/ToolboxContext';

export const useUserCard = () => {
	useEffect(() => {
		return () => {
			closeUserCard();
		};
	}, []);

	const openUserInfo = useTabBarOpenUserInfo();

	const open = useCallback(
		(username: string) => (event: UIEvent) => {
			event.preventDefault();
			openUserCard({
				username,
				target: event.currentTarget,
				open: (event: UIEvent) => {
					event.preventDefault();
					openUserInfo(username);
				},
			});
		},
		[openUserInfo],
	);

	return { open, close: closeUserCard };
};
