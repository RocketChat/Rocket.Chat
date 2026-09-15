import type { IMessage } from '@rocket.chat/core-typings';
import { isEditedMessage, isThreadMainMessage } from '@rocket.chat/core-typings';
import { Box, CheckBox, Field, FieldLabel, FieldRow } from '@rocket.chat/fuselage';
import { clientCallbacks } from '@rocket.chat/ui-client';
import { useEndpoint, useUserPreference } from '@rocket.chat/ui-contexts';
import { useCallback, useEffect, useId, useState } from 'react';
import { useTranslation } from 'react-i18next';

import MessageListErrorBoundary from '../room/MessageList/MessageListErrorBoundary';
import DropTargetOverlay from '../room/body/DropTargetOverlay';
import { useFileUploadDropTarget } from '../room/body/hooks/useFileUploadDropTarget';
import ComposerContainer from '../room/composer/ComposerContainer';
import RoomComposer from '../room/composer/RoomComposer/RoomComposer';
import { useChat } from '../room/contexts/ChatContext';
import { useRoom, useRoomSubscription } from '../room/contexts/RoomContext';
import ThreadMessageList from '../room/contextualBar/Threads/components/ThreadMessageList';
import { useThreadMainMessageQuery } from '../room/contextualBar/Threads/hooks/useThreadMainMessageQuery';
import { DateListProvider } from '../room/providers/DateListProvider';
import PageLoading from '../root/PageLoading';

type ConferenceThreadChatProps = {
	tmid: string;
	onEscape?: () => void;
};

const ConferenceThreadChat = ({ tmid, onEscape }: ConferenceThreadChatProps) => {
	const { t } = useTranslation();
	const chat = useChat();
	if (!chat) {
		throw new Error('No ChatContext provided');
	}

	const mainMessageQueryResult = useThreadMainMessageQuery(tmid);

	const sendToChannelPreference = useUserPreference<'always' | 'never' | 'default'>('alsoSendThreadToChannel');

	// Only the user's own decision is state. What the box would say on its own is a fact about the preference and
	// the thread — the first message of a thread also goes to the room, later ones don't — and a fact is read
	// rather than remembered. It used to be initialised into state before the main message had arrived, so the
	// thread's reply count could not be consulted, and the send handler then had to force the box back.
	const [overridden, setOverridden] = useState(false);

	const [fileUploadTriggerProps, fileUploadOverlayProps] = useFileUploadDropTarget();

	const handleNavigateToPreviousMessage = useCallback((): void => {
		chat?.messageEditing.toPreviousMessage();
	}, [chat?.messageEditing]);

	const handleNavigateToNextMessage = useCallback((): void => {
		chat?.messageEditing.toNextMessage();
	}, [chat?.messageEditing]);

	const room = useRoom();
	const readThread = useEndpoint('POST', '/v1/chat.readThread');

	useEffect(() => {
		clientCallbacks.add(
			'streamNewMessage',
			(msg: IMessage) => {
				if (room._id !== msg.rid || isEditedMessage(msg) || msg.tmid !== tmid) {
					return;
				}

				void Promise.resolve(readThread({ tmid })).catch(() => undefined);
			},
			clientCallbacks.priority.MEDIUM,
			`conference-thread-${room._id}`,
		);

		return () => {
			clientCallbacks.remove('streamNewMessage', `conference-thread-${room._id}`);
		};
	}, [tmid, readThread, room._id]);

	const subscription = useRoomSubscription();
	const sendToChannelID = useId();

	const [shouldJumpToBottom, setShouldJumpToBottom] = useState(true);

	if (mainMessageQueryResult.isLoading) {
		return <PageLoading />;
	}

	if (!mainMessageQueryResult.isSuccess) {
		return null;
	}

	const mainMessage = mainMessageQueryResult.data;

	const defaultSendToChannel = (() => {
		switch (sendToChannelPreference) {
			case 'always':
				return true;
			case 'never':
				return false;
			// A thread nobody has replied to yet is still part of the room's conversation, so its first reply is
			// offered to the room as well. Once the thread has replies it is its own place and the offer stops.
			default:
				return !mainMessage.tcount;
		}
	})();

	const sendToChannel = overridden ? !defaultSendToChannel : defaultSendToChannel;

	return (
		<Box
			is='section'
			position='relative'
			display='flex'
			flexDirection='column'
			flexGrow={1}
			flexShrink={1}
			flexBasis='auto'
			height='full'
			{...fileUploadTriggerProps}
		>
			<DropTargetOverlay {...fileUploadOverlayProps} />
			<DateListProvider>
				<MessageListErrorBoundary>
					<ThreadMessageList
						mainMessage={mainMessage}
						shouldJumpToBottom={shouldJumpToBottom}
						setShouldJumpToBottom={setShouldJumpToBottom}
					/>
				</MessageListErrorBoundary>

				<RoomComposer>
					<ComposerContainer
						tmid={mainMessage._id}
						threadExists={isThreadMainMessage(mainMessage)}
						subscription={subscription}
						onEscape={onEscape}
						onNavigateToPreviousMessage={handleNavigateToPreviousMessage}
						onNavigateToNextMessage={handleNavigateToNextMessage}
						tshow={sendToChannel}
					>
						<Field marginBlock={8}>
							<FieldRow justifyContent='initial'>
								<CheckBox
									id={sendToChannelID}
									checked={sendToChannel}
									onChange={() => setOverridden((current) => !current)}
									name='alsoSendThreadToChannel'
								/>
								<FieldLabel marginInlineStart='x8' htmlFor={sendToChannelID} color='annotation' fontScale='p2'>
									{t('Also_send_to_channel')}
								</FieldLabel>
							</FieldRow>
						</Field>
					</ComposerContainer>
				</RoomComposer>
			</DateListProvider>
		</Box>
	);
};

export default ConferenceThreadChat;
