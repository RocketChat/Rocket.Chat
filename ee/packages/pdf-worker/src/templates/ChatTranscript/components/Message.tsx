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

const messageLongerThanPage = (message: string | undefined) => (message?.length ?? 0) > 1200;
const markupEntriesGreaterThan10 = (messageMd: any[]) => messageMd.length > 10;
// When a markup list is greater than 10 (magic number, but a reasonable small/big number) we're gonna split the markdown into multiple <View> element
// So react-pdf can split them evenly across pages
const splitByTens = (array: any[] = []): any[][] => {
	const result = [];
	for (let i = 0; i < array.length; i += 10) {
		result.push(array.slice(i, i + 10));
	}
	return result;
};

const processMd = (message: PDFMessage) =>
	splitByTens(message.md).map((chunk, index) => (
		<View style={{ ...styles.message, ...(isSystemMessage(message) && styles.systemMessage) }} key={index}>
			<Markup tokens={chunk} />
		</View>
	));

const isSystemMessage = (message: PDFMessage) => !!message.t;

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
