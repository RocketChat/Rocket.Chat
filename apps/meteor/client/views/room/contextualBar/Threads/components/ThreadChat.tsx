import type { IMessage, IThreadMainMessage } from '@rocket.chat/core-typings';
import { isEditedMessage } from '@rocket.chat/core-typings';
import { Box, CheckBox, Field } from '@rocket.chat/fuselage';
import { useUniqueId } from '@rocket.chat/fuselage-hooks';
import { useMethod, useTranslation, useUserPreference } from '@rocket.chat/ui-contexts';
import React, { useState, useEffect, useCallback } from 'react';

import { callbacks } from '../../../../../../lib/callbacks';
import { ContextualbarContent } from '../../../../../components/Contextualbar';
import MessageListErrorBoundary from '../../../MessageList/MessageListErrorBoundary';
import DropTargetOverlay from '../../../body/DropTargetOverlay';
import { useFileUploadDropTarget } from '../../../body/hooks/useFileUploadDropTarget';
import ComposerContainer from '../../../composer/ComposerContainer';
import RoomComposer from '../../../composer/RoomComposer/RoomComposer';
import { useChat } from '../../../contexts/ChatContext';
import { useRoom, useRoomSubscription } from '../../../contexts/RoomContext';
import { useRoomToolbox } from '../../../contexts/RoomToolboxContext';
import ThreadMessageList from './ThreadMessageList';

type ThreadChatProps = {
	mainMessage: IThreadMainMessage;
};

const ThreadChat = ({ mainMessage }: ThreadChatProps) => {
	const [fileUploadTriggerProps, fileUploadOverlayProps] = useFileUploadDropTarget();

	const sendToChannelPreference = useUserPreference<'always' | 'never' | 'default'>('alsoSendThreadToChannel');

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

	const { closeTab } = useRoomToolbox();

	const handleComposerEscape = useCallback((): void => {
		closeTab();
	}, [closeTab]);

	const chat = useChat();

	const handleNavigateToPreviousMessage = useCallback((): void => {
		chat?.messageEditing.toPreviousMessage();
	}, [chat?.messageEditing]);

	const handleNavigateToNextMessage = useCallback((): void => {
		chat?.messageEditing.toNextMessage();
	}, [chat?.messageEditing]);

	const handleUploadFiles = useCallback(
		(files: readonly File[]): void => {
			chat?.flows.uploadFiles(files);
		},
		[chat?.flows],
	);

	const room = useRoom();
	const readThreads = useMethod('readThreads');
	useEffect(() => {
		callbacks.add(
			'streamNewMessage',
			(msg: IMessage) => {
				if (room._id !== msg.rid || isEditedMessage(msg) || msg.tmid !== mainMessage._id) {
					return;
				}

				readThreads(mainMessage._id);
			},
			callbacks.priority.MEDIUM,
			`thread-${room._id}`,
		);

		return () => {
			callbacks.remove('streamNewMessage', `thread-${room._id}`);
		};
	}, [mainMessage._id, readThreads, room._id]);

	const subscription = useRoomSubscription();
	const sendToChannelID = useUniqueId();
	const t = useTranslation();

	return (
		<ContextualbarContent flexShrink={1} flexGrow={1} paddingInline={0} {...fileUploadTriggerProps}>
			<DropTargetOverlay {...fileUploadOverlayProps} />
			<Box is='section' display='flex' flexDirection='column' flexGrow={1} flexShrink={1} flexBasis='auto' height='full'>
				<MessageListErrorBoundary>
					<ThreadMessageList mainMessage={mainMessage} />
				</MessageListErrorBoundary>

				<RoomComposer>
					<ComposerContainer
						rid={mainMessage.rid}
						tmid={mainMessage._id}
						subscription={subscription}
						onSend={handleSend}
						onEscape={handleComposerEscape}
						onNavigateToPreviousMessage={handleNavigateToPreviousMessage}
						onNavigateToNextMessage={handleNavigateToNextMessage}
						onUploadFiles={handleUploadFiles}
						tshow={sendToChannel}
					>
						<Field>
							<Field.Row marginBlock={8}>
								<CheckBox
									id={sendToChannelID}
									checked={sendToChannel}
									onChange={() => setSendToChannel((checked) => !checked)}
									name='alsoSendThreadToChannel'
								/>
								<Field.Label htmlFor={sendToChannelID} color='annotation' fontScale='p2'>
									{t('Also_send_to_channel')}
								</Field.Label>
							</Field.Row>
						</Field>
					</ComposerContainer>
				</RoomComposer>
			</Box>
		</ContextualbarContent>
	);
};

export default ThreadChat;
