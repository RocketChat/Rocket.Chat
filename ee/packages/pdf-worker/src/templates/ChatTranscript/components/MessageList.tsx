import Message from './Message';
import type { ChatTranscriptData } from '../../../types/ChatTranscriptData';

export type MessageListProps = { messages: ChatTranscriptData['messages']; invalidFileMessage: string };

export const MessageList = ({ messages, invalidFileMessage }: MessageListProps) => (
	<>
		{messages.map((message, index) => (
			<Message invalidFileMessage={invalidFileMessage} message={message} key={index} />
		))}
	</>
);
