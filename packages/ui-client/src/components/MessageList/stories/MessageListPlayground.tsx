import type { IMessage } from '@rocket.chat/core-typings';
import { Box, Button, ButtonGroup } from '@rocket.chat/fuselage';
import { useMemo, useRef, useState } from 'react';

import PlaceholderMessage from './PlaceholderMessage';
import PlaygroundHeader from './PlaygroundHeader';
import type { FakeHistoryOptions, FakeMessageSourceOptions } from './useFakeMessageSource';
import { createFakeHistory, fakeMessageId, useFakeMessageSource, VIEWER } from './useFakeMessageSource';
import type { MessageListHandle, MessageListProps } from '../MessageList';
import MessageList from '../MessageList';
import MessageListDateBubble from '../MessageListDateBubble';
import MessageListJumpToLatestButton from '../MessageListJumpToLatestButton';
import MessageListNewMessagesButton from '../MessageListNewMessagesButton';

export type MessageListPlaygroundProps = {
	history: FakeHistoryOptions;
	source?: Omit<FakeMessageSourceOptions, 'history'>;
	height?: number;
	hasControls?: boolean;
	hasHeader?: boolean;
	/** Lays the list out as a thread: replies grouped by author, only the floating date over it. */
	isThread?: boolean;
	initialTargetIndex?: number;
	list?: Partial<MessageListProps<IMessage>>;
};

const isOwnMessage = (message: IMessage) => message.u._id === VIEWER._id;

/**
 * A message list fed by the simulated server, with controls for everything that moves it: incoming and own messages, jumps,
 * resizes and loading.
 */
const MessageListPlayground = ({
	history: historyOptions,
	source: sourceOptions,
	height = 480,
	hasControls = true,
	hasHeader = true,
	isThread = false,
	initialTargetIndex,
	list,
}: MessageListPlaygroundProps) => {
	const history = useMemo(() => createFakeHistory(historyOptions), [historyOptions]);
	const source = useFakeMessageSource({ history, ...sourceOptions });
	const listRef = useRef<MessageListHandle>(null);
	const [targetMessageId, setTargetMessageId] = useState(initialTargetIndex === undefined ? undefined : fakeMessageId(initialTargetIndex));
	const [composerHeight, setComposerHeight] = useState(56);
	const [containerHeight, setContainerHeight] = useState(height);

	const jumpTo = (messageId: string | undefined) => {
		if (!messageId) {
			return;
		}
		setTargetMessageId(messageId);
		if (!source.messages.some((message) => message._id === messageId)) {
			void source.loadAround(messageId);
		}
	};

	const controls: [string, () => void][] = [
		['Receive message', () => source.receive()],
		['Receive late-resizing message', () => source.receive({ lateContent: true })],
		[
			'Send own message',
			() => {
				source.receive({ fromViewer: true });
				listRef.current?.scrollToBottom();
			},
		],
		['Jump to message 10', () => jumpTo(fakeMessageId(10))],
		['Jump to message 3 from the end', () => jumpTo(source.history[source.history.length - 4]?._id)],
		['Jump to first unread', () => jumpTo(source.firstUnreadMessageId)],
		['Toggle composer height', () => setComposerHeight((current) => (current === 56 ? 200 : 56))],
		['Toggle container height', () => setContainerHeight((current) => (current === height ? height - 160 : height))],
		['Settle loads', () => source.settleLoads()],
	];

	return (
		<Box display='flex' flexDirection='column' width={480} maxWidth='100%'>
			{hasControls && (
				<ButtonGroup wrap>
					{controls.map(([label, onClick]) => (
						<Button key={label} size='small' variant='secondary' onClick={onClick}>
							{label}
						</Button>
					))}
				</ButtonGroup>
			)}
			<Box display='flex' flexDirection='column' height={containerHeight} borderWidth='default' borderColor='light' marginBlockStart={8}>
				<Box flexGrow={1} flexShrink={1} minHeight={0}>
					<MessageList<IMessage>
						ref={listRef}
						aria-label='Message list'
						messages={source.messages}
						hasOlderMessages={source.hasOlderMessages}
						hasNewerMessages={source.hasNewerMessages}
						isLoadingOlderMessages={source.isLoadingOlderMessages}
						isLoadingNewerMessages={source.isLoadingNewerMessages}
						isLoadingInitialMessages={source.isLoadingInitialMessages}
						onLoadOlderMessages={source.loadOlder}
						onLoadNewerMessages={source.loadNewer}
						onJumpToLatest={source.jumpToLatest}
						firstUnreadMessageId={source.firstUnreadMessageId}
						targetMessageId={targetMessageId}
						onTargetMessageReached={() => setTargetMessageId(undefined)}
						isOwnMessage={isOwnMessage}
						groupsThreadReplies={!isThread}
						header={hasHeader ? <PlaygroundHeader /> : undefined}
						renderMessage={(row) => <PlaceholderMessage message={row.message} isSequential={row.isSequential} />}
						{...list}
					>
						<MessageListDateBubble />
						{!isThread && <MessageListNewMessagesButton />}
						{!isThread && <MessageListJumpToLatestButton />}
					</MessageList>
				</Box>
				<Box height={composerHeight} flexShrink={0} borderBlockStartWidth='default' borderColor='light' data-qa='composer' />
			</Box>
		</Box>
	);
};

export default MessageListPlayground;
