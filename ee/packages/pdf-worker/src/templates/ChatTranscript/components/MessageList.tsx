import Message from './Message';
import type { ChatTranscriptData } from '../../../types/ChatTranscriptData';

export const MessageList = ({ messages, invalidFileMessage }: { messages: ChatTranscriptData['messages']; invalidFileMessage: string }) => (
	<>
		{messages.map((message, index) => (
			<Message invalidFileMessage={invalidFileMessage} message={message} key={index} />
		))}
	</>
);
