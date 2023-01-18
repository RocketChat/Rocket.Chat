import { useCurrentRoute, useRoute } from '@rocket.chat/ui-contexts';
import type { ContextType, MouseEvent, ReactNode, UIEvent, VFC } from 'react';
import React, { useMemo, memo } from 'react';

import { openUserCard } from '../../../../app/ui/client/lib/UserCard';
import { MessageContext } from '../../../components/message/MessageContext';
import { useRoom } from '../contexts/RoomContext';

type MessageProviderProps = {
	children: ReactNode;
};

const MessageProvider: VFC<MessageProviderProps> = ({ children }) => {
	const room = useRoom();
	const [routeName, params] = useCurrentRoute();
	if (!routeName) {
		throw new Error('routeName is not defined');
	}

	const router = useRoute(routeName);

	const context = useMemo((): ContextType<typeof MessageContext> => {
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

		return {
			actions: {
				openUserCard:
					(username: string) =>
					(e: UIEvent): void => {
						openUserCard({
							username,
							rid: room._id,
							target: e.currentTarget,
							open: (e: MouseEvent<HTMLDivElement>) => {
								e.preventDefault();
								openUserInfo(username);
							},
						});
					},
			},
		};
	}, [router, params, routeName, room._id]);

	return <MessageContext.Provider value={context}>{children}</MessageContext.Provider>;
};

export default memo(MessageProvider);
