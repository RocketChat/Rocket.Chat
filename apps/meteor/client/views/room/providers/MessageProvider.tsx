import { IMessage } from '@rocket.chat/core-typings';
import { useLayout, useCurrentRoute, useRoute, useSetting, useMethod } from '@rocket.chat/ui-contexts';
import React, { ReactNode, useMemo, memo, MouseEvent, UIEvent } from 'react';

import { actionLinks } from '../../../../app/action-links/client';
import { Messages } from '../../../../app/models/client';
import { ChatMessages } from '../../../../app/ui/client';
import { openUserCard } from '../../../../app/ui/client/lib/UserCard';
import { getRandomId } from '../../../../lib/random';
import { useFormatDateAndTime } from '../../../hooks/useFormatDateAndTime';
import { useFormatTime } from '../../../hooks/useFormatTime';
import { onClientBeforeSendMessage } from '../../../lib/onClientBeforeSendMessage';
import { roomCoordinator } from '../../../lib/rooms/roomCoordinator';
import { fireGlobalEvent } from '../../../lib/utils/fireGlobalEvent';
import { goToRoomById } from '../../../lib/utils/goToRoomById';
import { MessageContext } from '../contexts/MessageContext';
import { useTabBarOpen } from '../contexts/ToolboxContext';

export const MessageProvider = memo(function MessageProvider({
	rid,
	broadcast,
	children,
}: {
	rid: string;
	broadcast?: boolean;
	children: ReactNode;
}) {
	const tabBarOpen = useTabBarOpen();
	const [routeName, params, queryStringParams] = useCurrentRoute();
	const { isEmbedded, isMobile } = useLayout();
	const oembedEnabled = Boolean(useSetting('API_Embed'));
	if (!routeName) {
		throw new Error('routeName is not defined');
	}

	const router = useRoute(routeName);

	const sendMessage = useMethod('sendMessage');

	const time = useFormatTime();
	const dateAndTime = useFormatDateAndTime();
	const context = useMemo(() => {
		const openThread =
			(tmid: string, jump?: string): ((e: MouseEvent) => void) =>
			(e: MouseEvent): void => {
				e.stopPropagation();

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
			oembedEnabled,
			oembedMaxWidth: isMobile ? ('100%' as const) : ('368px' as `${number}px`),
			oembedMaxHeight: '368px' as `${number}px`,
			broadcast: Boolean(broadcast),
			actions: {
				runActionLink,
				openUserCard:
					(username: string) =>
					(e: UIEvent): void => {
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
				sendMessage: async ({ msg }: { msg: string }): Promise<void> => {
					let msgObject = { _id: getRandomId(), rid, msg } as IMessage;
					if (!msg) {
						return;
					}

					msgObject = (await onClientBeforeSendMessage(msgObject)) as IMessage;

					const chatMessagesInstance = ChatMessages.get({ rid });
					if (await chatMessagesInstance?.slashCommandProcessor?.process(msgObject)) {
						return;
					}

					await sendMessage(msgObject);
				},
				respondWithMessage: async ({ msg }: { msg: string }): Promise<void> => {
					const chatMessagesInstance = ChatMessages.get({ rid });
					if (chatMessagesInstance?.input) {
						chatMessagesInstance.input.value = msg;
						chatMessagesInstance.input.focus();
					}
				},
				respondWithQuotedMessage: async ({ mid }: { mid: string }): Promise<void> => {
					const chatMessagesInstance = ChatMessages.get({ rid });
					if (!mid || !chatMessagesInstance) {
						return;
					}

					const message = Messages.findOne({ _id: mid }); // TODO: find a way to get the message from the collection without a query

					chatMessagesInstance.quotedMessages.add(message);

					$(chatMessagesInstance)?.trigger('focus').data('mention-user', false).trigger('dataChange');
				},
			},
			formatters: {
				time,
				dateAndTime,
			},
		};
	}, [
		isEmbedded,
		oembedEnabled,
		isMobile,
		broadcast,
		time,
		dateAndTime,
		router,
		params,
		rid,
		routeName,
		tabBarOpen,
		queryStringParams,
		sendMessage,
	]);

	return <MessageContext.Provider value={context}>{children}</MessageContext.Provider>;
});
