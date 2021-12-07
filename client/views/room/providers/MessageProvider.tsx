import React, { ReactNode, useMemo, memo } from 'react';

import { useCurrentRoute, useRoute } from '../../../contexts/RouterContext';
import { useFormatTime } from '../../../hooks/useFormatTime';
import { goToRoomById } from '../../../lib/utils/goToRoomById';
import { MessageContext } from '../contexts/MessageContext';

const replyBroadcast = () => {
	console.log('replyBroadcast');
};

export const MessageProvider = memo(function MessageProvider({
	broadcast,
	children,
}: {
	broadcast?: boolean;
	children: ReactNode;
}) {
	const [routeName, params] = useCurrentRoute();

	if (!routeName) {
		throw new Error('routeName is not defined');
	}

	const router = useRoute(routeName);

	const messageHeader = useFormatTime();
	const context = useMemo(() => {
		const openThread =
			(rid: string, tmid: string, jump?: string): (() => void) =>
			(): void => {
				router.replace(
					{
						...params,
						rid,
						tab: 'thread',
						context: tmid,
					},
					jump ? { jump } : undefined,
				);
			};
		const openDiscussion = (drid: string) => (): Promise<void> => goToRoomById(drid);

		const openUserCard = () => {
			console.log('openUserCard');
			// openUserCard({
			// 	username,
			// 	rid: instance.data.rid,
			// 	target: e.currentTarget,
			// 	open: (e) => {
			// 		e.preventDefault();
			// 		instance.data.tabBar.openUserInfo(username);
			// 	},
			// });
		};

		return {
			broadcast: Boolean(broadcast),
			actions: {
				openUserCard,
				openDiscussion,
				openThread,
				replyBroadcast,
			},
			formatters: {
				messageHeader,
			},
		};
	}, [broadcast, messageHeader, router, params]);

	return <MessageContext.Provider value={context}>{children}</MessageContext.Provider>;
});
