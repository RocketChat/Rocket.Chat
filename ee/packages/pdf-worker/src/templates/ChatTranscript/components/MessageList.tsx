import type { ChatTranscriptData } from '..';
import Message from './Message';

export const MessageList = ({ messages, invalidFileMessage }: { messages: ChatTranscriptData['messages']; invalidFileMessage: string }) => (
	<>
		{messages.map((message, index) => (
			<Message invalidFileMessage={invalidFileMessage} message={message} key={index} />
		))}
	</>
);
