import * as path from 'path';

import ReactPDF, { Font, Document, Page, StyleSheet } from '@react-pdf/renderer';
import type { ILivechatAgent, ILivechatVisitor, IOmnichannelSystemMessage, Serialized } from '@rocket.chat/core-typings';
import colors from '@rocket.chat/fuselage-tokens/colors.json';
import type { Root } from '@rocket.chat/message-parser';

import { Header } from './components/Header';
import { MessageList } from './components/MessageList';

const FONT_PATH = path.resolve(__dirname, '../../public');

export type PDFFile = { name?: string; buffer: Buffer | null; extension?: 'png' | 'jpg' };

export type Quote = { md: Root; name: string; ts: string };

export type PDFMessage = Serialized<
	Omit<
		Pick<
			IOmnichannelSystemMessage,
			'msg' | 'u' | 'ts' | 'md' | 't' | 'navigation' | 'transferData' | 'requestData' | 'webRtcCallEndTs' | 'comment'
		>,
		'files'
	>
> & {
	files?: PDFFile[];
} & { divider?: string } & { quotes?: Quote[] };

export type ChatTranscriptData = {
	header: {
		agent: Pick<ILivechatAgent, 'name' | 'username'>;
		visitor: Pick<ILivechatVisitor, 'name' | 'username'>;
		siteName: string;
		date: string;
		time: string;
	};
	messages: PDFMessage[];
	t: (key: string) => string;
};

const styles = StyleSheet.create({
	page: {
		fontFamily: 'Inter',
		lineHeight: 1.25,
		color: colors.n800,
		// ugh https://github.com/diegomura/react-pdf/issues/684
		paddingBottom: 32,
	},
	wrapper: {
		paddingHorizontal: 32,
	},
	message: {
		wordWrap: 'break-word',
		fontSize: 12,
		marginBottom: 20,
		textAlign: 'justify',
	},
});

export const ChatTranscriptPDF = ({ header, messages, t }: ChatTranscriptData) => {
	const agentValue = header.agent?.name || header.agent?.username || t('Not_assigned');
	const customerValue = header.visitor?.name || header.visitor?.username;
	const dateValue = header.date;
	const timeValue = header.time;

	return (
		<Document>
			<Page size='A4' style={styles.page} wrap>
				<Header
					title={header.siteName}
					subtitle={t('Chat_transcript')}
					values={[
						{ key: t('Agent'), value: agentValue },
						{ key: t('Date'), value: dateValue },
						{ key: t('Customer'), value: customerValue },
						{ key: t('Time'), value: timeValue },
					]}
				/>
				<MessageList messages={messages} invalidFileMessage={t('This_attachment_is_not_supported')} />
			</Page>
		</Document>
	);
};

export default async (data: ChatTranscriptData): Promise<NodeJS.ReadableStream> => {
	Font.register({
		family: 'Inter',
		fonts: [
			{ src: `${FONT_PATH}/inter400.ttf` },
			{ src: `${FONT_PATH}/inter400-italic.ttf`, fontStyle: 'italic' },
			{ src: `${FONT_PATH}/inter500.ttf`, fontWeight: 500 },
			{ src: `${FONT_PATH}/inter500-italic.ttf`, fontWeight: 500, fontStyle: 'italic' },
			{ src: `${FONT_PATH}/inter700.ttf`, fontWeight: 700 },
			{ src: `${FONT_PATH}/inter700-italic.ttf`, fontWeight: 700, fontStyle: 'italic' },
		],
	});
	Font.register({
		family: 'FiraCode',
		fonts: [{ src: `${FONT_PATH}/fira-code700.ttf`, fontWeight: 700 }],
	});
	Font.registerHyphenationCallback((word) => [word]);

	return ReactPDF.renderToStream(<ChatTranscriptPDF {...data} />);
};
