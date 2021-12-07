import React, { ReactNode, useMemo, memo, MouseEvent } from 'react';

import { openUserCard } from '../../../../app/ui/client/lib/UserCard';
import { useCurrentRoute, useRoute } from '../../../contexts/RouterContext';
import { useFormatTime } from '../../../hooks/useFormatTime';
import { goToRoomById } from '../../../lib/utils/goToRoomById';
import { MessageContext } from '../contexts/MessageContext';

const replyBroadcast = () => {
	console.log('replyBroadcast');
};

export const MessageProvider = memo(function MessageProvider({
	broadcast,
	rid,
	children,
}: {
	rid: string;
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
			(tmid: string, jump?: string): (() => void) =>
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

		const openUserInfo = (username: string): void => {
			const tab =
				{
					channel: 'members-list',
					group: 'members-list',
					direct: 'user-info',
					livechat: 'room-info',
				}[routeName] || 'members-list';

			router.replace({
				...params,
				tab,
				context: username,
			});
		};
		const openDiscussion = (drid: string) => (): Promise<void> => goToRoomById(drid);

		return {
			broadcast: Boolean(broadcast),
			actions: {
				openUserCard:
					(username: string) =>
					(e: MouseEvent<HTMLDivElement>): void => {
						openUserCard({
							username,
							rid,
							target: e.currentTarget,
							open: (e: MouseEvent<HTMLDivElement>) => {
								e.preventDefault();
								openUserInfo(username);
							},
						});
					},
				openDiscussion,
				openThread,
				replyBroadcast,
			},
			formatters: {
				messageHeader,
			},
		};
	}, [broadcast, messageHeader, router, params, rid, routeName]);

	return <MessageContext.Provider value={context}>{children}</MessageContext.Provider>;
});
