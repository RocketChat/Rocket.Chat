import { View, StyleSheet } from '@react-pdf/renderer';

import { Divider } from './Divider';
import { MessageHeader } from './MessageHeader';
import { Files } from './Files';
import { MessageContent } from './MessageContent';
import type { ChatTranscriptData } from '..';

const styles = StyleSheet.create({
	wrapper: {
		marginBottom: 16,
		paddingHorizontal: 32,
	},
});

export const MessageList = ({ messages, invalidFileMessage }: { messages: ChatTranscriptData['messages']; invalidFileMessage: string }) => (
	<View>
		{messages.map((message, index) => (
			<View style={styles.wrapper} key={index} wrap={false}>
				{message.divider && <Divider divider={message.divider} />}
				<MessageHeader name={message.u.name || message.u.username} time={message.ts} />
				<MessageContent message={message.msg} />
				{message.files && <Files files={message.files} invalidMessage={invalidFileMessage} />}
			</View>
		))}
	</View>
);
