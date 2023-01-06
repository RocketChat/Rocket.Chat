import type { IMessage } from '@rocket.chat/core-typings';
import { useLayout, useCurrentRoute, useRoute } from '@rocket.chat/ui-contexts';
import type { ContextType, MouseEvent, ReactNode, UIEvent, VFC } from 'react';
import React, { useMemo, memo } from 'react';

import { actionLinks } from '../../../../app/action-links/client';
import { openUserCard } from '../../../../app/ui/client/lib/UserCard';
import { MessageContext } from '../../../components/message/MessageContext';
import { roomCoordinator } from '../../../lib/rooms/roomCoordinator';
import { fireGlobalEvent } from '../../../lib/utils/fireGlobalEvent';
import { goToRoomById } from '../../../lib/utils/goToRoomById';
import { useRoom } from '../contexts/RoomContext';
import { useTabBarOpen } from '../contexts/ToolboxContext';

type MessageProviderProps = { children: ReactNode };

const MessageProvider: VFC<MessageProviderProps> = ({ children }) => {
	const tabBarOpen = useTabBarOpen();
	const [routeName, params, queryStringParams] = useCurrentRoute();
	const { isEmbedded } = useLayout();
	if (!routeName) {
		throw new Error('routeName is not defined');
	}

	const router = useRoute(routeName);
	const room = useRoom();

	const context = useMemo((): ContextType<typeof MessageContext> => {
		const openThread =
			(tmid: string, jump?: string): ((e: UIEvent) => void) =>
			(e: UIEvent): void => {
				e.stopPropagation();

				router.replace(
					{
						...params,
						rid: room._id,
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
		const openRoom = (id: string) => (): Promise<void> => goToRoomById(id);

		const runActionLink = isEmbedded
			? (msg: IMessage) => (actionLink: string) => (): void =>
					fireGlobalEvent('click-action-link', {
						actionlink: actionLink,
						value: msg._id,
						message: msg,
					})
			: (msg: IMessage) => (actionLink: string) => (): void => {
					actionLinks.run(actionLink, msg, tabBarOpen);
			  };
		return {
			actions: {
				runActionLink,
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
				openRoom,
				openThread,
				replyBroadcast: (message: IMessage): void => {
					roomCoordinator.openRouteLink(
						'd',
						{ name: message.u.username },
						{
							...queryStringParams,
							reply: message._id,
						},
					);
				},
			},
		};
	}, [isEmbedded, router, params, room._id, routeName, tabBarOpen, queryStringParams]);

	return <MessageContext.Provider value={context}>{children}</MessageContext.Provider>;
};

export default memo(MessageProvider);
