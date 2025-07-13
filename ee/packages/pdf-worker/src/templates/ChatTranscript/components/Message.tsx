import { Text, View, StyleSheet } from '@react-pdf/renderer';
import { fontScales } from '@rocket.chat/fuselage-tokens/typography.json';

import type { PDFMessage } from '..';
import { Markup } from '../markup';
import { Divider } from './Divider';
import { Files } from './Files';
import { MessageHeader } from './MessageHeader';
import { Quotes } from './Quotes';
import { isSystemMessage, markupEntriesGreaterThan10, messageLongerThanPage, splitByTens } from './utils';

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

const processMd = (message: PDFMessage) =>
	splitByTens(message.md).map((chunk, index) => (
		<View style={{ ...styles.message, ...(isSystemMessage(message) && styles.systemMessage) }} key={index}>
			<Markup tokens={chunk as NonNullable<PDFMessage['md']>} />
		</View>
	));

const processMessage = (message: PDFMessage) => {
	if (message.md) {
		if (markupEntriesGreaterThan10(message.md)) {
			return processMd(message);
		}

		return (
			<View style={{ ...styles.message, ...(isSystemMessage(message) && styles.systemMessage) }}>
				<Markup tokens={message.md}></Markup>
			</View>
		);
	}

	return (
		<View style={{ ...styles.message, ...(isSystemMessage(message) && styles.systemMessage) }}>
			<Text>{message.msg}</Text>
		</View>
	);
};

const Message = ({ message, invalidFileMessage }: { message: PDFMessage; invalidFileMessage: string }) => (
	<View style={styles.wrapper} wrap={!!message.quotes || messageLongerThanPage(message.msg)}>
		{message.divider && <Divider divider={message.divider} />}
		<MessageHeader name={message.u.name || message.u.username} time={message.ts} />

		{processMessage(message)}
		{message.quotes && <Quotes quotes={message.quotes} />}

		{message.files && <Files files={message.files} invalidMessage={invalidFileMessage} />}
	</View>
);

export default Message;
