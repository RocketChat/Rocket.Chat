import { Text, View, StyleSheet } from '@react-pdf/renderer';
import { fontScales } from '@rocket.chat/fuselage-tokens/typography.json';

import type { PDFMessage } from '..';
import { Markup } from '../markup';
import { Divider } from './Divider';
import { Files } from './Files';
import { MessageHeader } from './MessageHeader';
import { Quotes } from './Quotes';

const styles = StyleSheet.create({
	wrapper: {
		marginBottom: 16,
		paddingBottom: 16,
		paddingHorizontal: 32,
	},
	message: {
		marginTop: 1,
		fontSize: fontScales.p2.fontSize,
	},
	systemMessage: {
		fontStyle: 'italic',
	},
});

const messageLongerThanPage = (message: string) => message.length > 1200;

const isSystemMessage = (message: PDFMessage) => !!message.t;

const Message = ({ message, invalidFileMessage }: { message: PDFMessage; invalidFileMessage: string }) => (
	<View style={styles.wrapper}>
		<View wrap={!!message.quotes || messageLongerThanPage(message.msg)}>
			{message.divider && <Divider divider={message.divider} />}
			<MessageHeader name={message.u.name || message.u.username} time={message.ts} />
			<View style={{ ...styles.message, ...(isSystemMessage(message) && styles.systemMessage) }}>
				{message.md ? <Markup tokens={message.md} /> : <Text>{message.msg}</Text>}
			</View>
			{message.quotes && <Quotes quotes={message.quotes} />}
		</View>

		{message.files && <Files files={message.files} invalidMessage={invalidFileMessage} />}
	</View>
);

export default Message;
