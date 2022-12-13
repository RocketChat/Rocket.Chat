import type { IThreadMainMessage } from '@rocket.chat/core-typings';
import { CheckBox } from '@rocket.chat/fuselage';
import { useUniqueId } from '@rocket.chat/fuselage-hooks';
import { useTranslation, useUserPreference } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useState, useEffect, useCallback, useContext, useRef } from 'react';

import type { ThreadTemplateInstance } from '../../../../../../app/threads/client/flextab/thread';
import VerticalBar from '../../../../../components/VerticalBar';
import MessageHighlightContext from '../../../MessageList/contexts/MessageHighlightContext';
import DropTargetOverlay from '../../../components/body/DropTargetOverlay';
import { useFileUploadDropTarget } from '../../../components/body/useFileUploadDropTarget';
import { ChatContext } from '../../../contexts/ChatContext';
import { MessageContext } from '../../../contexts/MessageContext';
import { useRoom, useRoomSubscription } from '../../../contexts/RoomContext';
import { useTabBarOpenUserInfo } from '../../../contexts/ToolboxContext';

type ThreadChatProps = {
	mainMessage: IThreadMainMessage;
};

const ThreadChat = ({ mainMessage }: ThreadChatProps): ReactElement => {
	const t = useTranslation();
	const ref = useRef<HTMLElement>(null);

	const chatContext = useContext(ChatContext);
	const messageContext = useContext(MessageContext);

	const messageHighlightContext = useContext(MessageHighlightContext);

	const room = useRoom();
	const subscription = useRoomSubscription();
	const openRoomInfo = useTabBarOpenUserInfo();

	const [fileUploadTriggerProps, fileUploadOverlayProps] = useFileUploadDropTarget();

	const sendToChannelPreference = useUserPreference('alsoSendThreadToChannel');

	const [sendToChannel, setSendToChannel] = useState(() => {
		switch (sendToChannelPreference) {
			case 'always':
				return true;
			case 'never':
				return false;
			default:
				return !mainMessage.tcount;
		}
	});

	const handleSend = useCallback((): void => {
		if (sendToChannelPreference === 'default') {
			setSendToChannel(false);
		}
	}, [sendToChannelPreference]);

	const reactiveViewDataRef = useRef(
		new ReactiveVar<ThreadTemplateInstance['data']>({
			mainMessage,
			subscription,
			rid: room._id,
			tabBar: { openRoomInfo },
			chatContext,
			messageContext,
			messageHighlightContext,
			sendToChannel,
			onSend: handleSend,
		}),
	);

	useEffect(() => {
		reactiveViewDataRef.current.set({
			mainMessage,
			subscription,
			rid: room._id,
			tabBar: { openRoomInfo },
			chatContext,
			messageContext,
			messageHighlightContext,
			sendToChannel,
			onSend: handleSend,
		});
	}, [chatContext, handleSend, mainMessage, messageContext, messageHighlightContext, openRoomInfo, room._id, sendToChannel, subscription]);

	const viewDataFn = useCallback(() => reactiveViewDataRef.current.get(), []);

	useEffect(() => {
		if (!ref.current) {
			return;
		}
		const view = Blaze.renderWithData(Template.thread, viewDataFn, ref.current);

		return (): void => {
			Blaze.remove(view);
		};
	}, [viewDataFn]);

	const sendToChannelID = useUniqueId();

	return (
		<>
			<VerticalBar.Content ref={ref} flexShrink={1} flexGrow={1} paddingInline={0} {...fileUploadTriggerProps} />
			<DropTargetOverlay {...fileUploadOverlayProps} />
			<section className='contextual-bar__content flex-tab threads' style={{ flexShrink: 0, flexBasis: 36 }}>
				<footer className='thread-footer'>
					<div style={{ display: 'flex' }}>
						<CheckBox id={sendToChannelID} checked={sendToChannel} onChange={() => setSendToChannel((checked) => !checked)} />
					</div>
					<label htmlFor={sendToChannelID} className='thread-footer__text'>
						{t('Also_send_to_channel')}
					</label>
				</footer>
			</section>
		</>
	);
};

export default ThreadChat;
