import React, { ReactNode, useMemo, memo, MouseEvent } from 'react';

import { actionLinks } from '../../../../app/action-links/client';
import { openUserCard } from '../../../../app/ui/client/lib/UserCard';
import { IMessage } from '../../../../definition/IMessage';
import { useLayout } from '../../../contexts/LayoutContext';
import { useCurrentRoute, useRoute } from '../../../contexts/RouterContext';
import { useSetting } from '../../../contexts/SettingsContext';
import { useFormatTime } from '../../../hooks/useFormatTime';
import { fireGlobalEvent } from '../../../lib/utils/fireGlobalEvent';
import { goToRoomById } from '../../../lib/utils/goToRoomById';
import { MessageContext } from '../contexts/MessageContext';

const replyBroadcast = (): void => {
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
	const { isEmbedded, isMobile } = useLayout();
	const oembedEnabled = Boolean(useSetting('API_Embed'));
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

		const runActionLink = isEmbedded
			? (msg: IMessage) => (actionLink: string) => (): void =>
					fireGlobalEvent('click-action-link', {
						actionlink: actionLink,
						value: msg._id,
						message: msg,
					})
			: (msg: IMessage) => (actionLink: string) => (): void => {
					actionLinks.run(actionLink, msg, undefined);
			  };
		return {
			oembedEnabled,
			oembedMaxWidth: isMobile ? ('100%' as const) : ('368px' as `${number}px`),
			broadcast: Boolean(broadcast),
			actions: {
				runActionLink,
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
	}, [
		isEmbedded,
		oembedEnabled,
		isMobile,
		broadcast,
		messageHeader,
		router,
		params,
		rid,
		routeName,
	]);

	return <MessageContext.Provider value={context}>{children}</MessageContext.Provider>;
});
