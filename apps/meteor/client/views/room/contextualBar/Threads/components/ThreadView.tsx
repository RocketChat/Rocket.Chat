import type { IThreadMainMessage } from '@rocket.chat/core-typings';
import { useQueryStringParameter } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useState, useEffect, useContext, useRef } from 'react';

import type { ThreadTemplateInstance } from '../../../../../../app/threads/client/flextab/thread';
import VerticalBar from '../../../../../components/VerticalBar';
import MessageHighlightContext from '../../../MessageList/contexts/MessageHighlightContext';
import { ChatContext } from '../../../contexts/ChatContext';
import { MessageContext } from '../../../contexts/MessageContext';
import { useRoom, useRoomSubscription } from '../../../contexts/RoomContext';
import { useTabBarOpenUserInfo } from '../../../contexts/ToolboxContext';

type ThreadViewProps = {
	mainMessage: IThreadMainMessage;
	following: boolean;
};

const ThreadView = ({ mainMessage, following }: ThreadViewProps): ReactElement => {
	const ref = useRef<HTMLElement>(null);

	const chatContext = useContext(ChatContext);
	const messageContext = useContext(MessageContext);

	const messageHighlightContext = useContext(MessageHighlightContext);
	const { current: messageHighlightContextReactiveVar } = useRef(new ReactiveVar(messageHighlightContext));
	useEffect(() => {
		messageHighlightContextReactiveVar.set(messageHighlightContext);
	}, [messageHighlightContext, messageHighlightContextReactiveVar]);

	const jump = useQueryStringParameter('jump');

	const room = useRoom();
	const subscription = useRoomSubscription();
	const openRoomInfo = useTabBarOpenUserInfo();

	const [viewData, setViewData] = useState<ThreadTemplateInstance['data']>(() => ({
		mainMessage,
		jump,
		following,
		subscription,
		rid: room._id,
		tabBar: { openRoomInfo },
		chatContext,
		messageContext,
		messageHighlightContext: () => messageHighlightContextReactiveVar.get(),
	}));

	useEffect(() => {
		setViewData((viewData) => {
			if (!mainMessage || viewData.mainMessage?._id === mainMessage._id) {
				return viewData;
			}

			return {
				mainMessage,
				jump,
				following,
				subscription,
				rid: room._id,
				tabBar: { openRoomInfo },
				chatContext,
				messageContext,
				messageHighlightContext: () => messageHighlightContextReactiveVar.get(),
			};
		});
	}, [chatContext, following, jump, messageContext, messageHighlightContextReactiveVar, subscription, mainMessage, room._id, openRoomInfo]);

	useEffect(() => {
		if (!ref.current || !viewData.mainMessage) {
			return;
		}
		const view = Blaze.renderWithData(Template.thread, viewData, ref.current);

		return (): void => {
			Blaze.remove(view);
		};
	}, [viewData]);

	return <VerticalBar.Content ref={ref} flexShrink={1} flexGrow={1} paddingInline={0} />;
};

export default ThreadView;
