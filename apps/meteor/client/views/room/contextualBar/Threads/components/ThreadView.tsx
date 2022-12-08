import type { IMessage } from '@rocket.chat/core-typings';
import { css } from '@rocket.chat/css-in-js';
import { useQueryStringParameter, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement, ReactNode } from 'react';
import React, { useState, useEffect, useContext, useRef } from 'react';

import VerticalBar from '../../../../../components/VerticalBar';
import MessageHighlightContext from '../../../MessageList/contexts/MessageHighlightContext';
import { ChatContext } from '../../../contexts/ChatContext';
import { MessageContext } from '../../../contexts/MessageContext';
import { useRoom, useRoomSubscription } from '../../../contexts/RoomContext';
import { useTabBarOpenUserInfo } from '../../../contexts/ToolboxContext';
import { useThreadMessage } from '../hooks/useThreadMessage';

type ThreadViewProps = {
	tmid: IMessage['_id'];
	onGoBack: (e: unknown) => void;
	canExpand: boolean;
	expanded: boolean;
	onToggleExpand: () => void;
	title: ReactNode;
	following: boolean;
	onToggleFollowing: () => void;
	onClose: () => void;
};

const ThreadView = ({
	tmid,
	title,
	canExpand,
	expanded,
	following,
	onToggleExpand,
	onToggleFollowing,
	onClose,
	onGoBack,
}: ThreadViewProps): ReactElement => {
	const t = useTranslation();

	const expandLabel = expanded ? t('Collapse') : t('Expand');
	const expandIcon = expanded ? 'arrow-collapse' : 'arrow-expand';

	const followLabel = following ? t('Following') : t('Not_Following');
	const followIcon = following ? 'bell' : 'bell-off';

	const expandedThreadStyle =
		canExpand && expanded
			? css`
					max-width: 855px !important;
					@media (min-width: 780px) and (max-width: 1135px) {
						max-width: calc(100% - var(--sidebar-width)) !important;
					}
			  `
			: undefined;

	const ref = useRef<HTMLElement>(null);

	const chatContext = useContext(ChatContext);
	const messageContext = useContext(MessageContext);

	const messageHighlightContext = useContext(MessageHighlightContext);
	const { current: messageHighlightContextReactiveVar } = useRef(new ReactiveVar(messageHighlightContext));
	useEffect(() => {
		messageHighlightContextReactiveVar.set(messageHighlightContext);
	}, [messageHighlightContext, messageHighlightContextReactiveVar]);

	const mainMessage = useThreadMessage(tmid);

	const jump = useQueryStringParameter('jump');

	const room = useRoom();
	const subscription = useRoomSubscription();
	const openRoomInfo = useTabBarOpenUserInfo();

	const [viewData, setViewData] = useState(() => ({
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

	return (
		<VerticalBar
			rcx-thread-view
			className={expandedThreadStyle}
			position={canExpand && expanded ? 'fixed' : 'absolute'}
			display='flex'
			flexDirection='column'
			width='full'
			overflow='hidden'
			zIndex={100}
			insetBlock={0}
		>
			<VerticalBar.Header>
				{onGoBack && <VerticalBar.Action onClick={onGoBack} title={t('Back_to_threads')} name='arrow-back' />}
				{title}
				{canExpand && <VerticalBar.Action title={expandLabel} name={expandIcon} onClick={onToggleExpand} />}
				<VerticalBar.Actions>
					<VerticalBar.Action title={followLabel} name={followIcon} onClick={onToggleFollowing} />
					<VerticalBar.Close onClick={onClose} />
				</VerticalBar.Actions>
			</VerticalBar.Header>
			<VerticalBar.Content ref={ref} flexShrink={1} flexGrow={1} paddingInline={0} />
		</VerticalBar>
	);
};

export default ThreadView;
