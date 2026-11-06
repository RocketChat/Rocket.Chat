import { Text, View, StyleSheet } from '@react-pdf/renderer';
import typography from '@rocket.chat/fuselage-tokens/dist/typography.json' with { type: 'json' };

import { Divider } from './Divider.js';
import { Files } from './Files.js';
import { MessageHeader } from './MessageHeader.js';
import Quotes from './Quotes.js';
import { isSystemMessage, markupEntriesGreaterThan10, messageLongerThanPage, splitByTens } from './utils.js';
import type { PDFMessage } from '../../../types/ChatTranscriptData.js';
import { canRenderMarkup } from '../markup/canRenderMarkup.js';
import { Markup } from '../markup/index.js';

const { fontScale } = typography;

const styles = StyleSheet.create({
	wrapper: {
		marginBottom: 16,
		paddingBottom: 16,
		paddingHorizontal: 32,
	},
	message: {
		marginTop: 1,
		fontSize: fontScale.p2.fontSize,
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
	if (message.md && canRenderMarkup(message.md)) {
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

export type MessageProps = { message: PDFMessage; invalidFileMessage: string };

const Message = ({ message, invalidFileMessage }: MessageProps) => (
	<View style={styles.wrapper} wrap={!!message.quotes || messageLongerThanPage(message.msg) || (message.files && message.files.length > 0)}>
		{message.divider && <Divider divider={message.divider} />}
		<MessageHeader name={message.u.name || message.u.username} time={message.ts} />

		{processMessage(message)}
		{message.quotes && <Quotes quotes={message.quotes} />}

		{message.files && <Files files={message.files} invalidMessage={invalidFileMessage} />}
	</View>
);

export default Message;
