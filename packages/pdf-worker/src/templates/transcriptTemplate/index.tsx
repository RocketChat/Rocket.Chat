import type { ILivechatAgent, ILivechatVisitor, IMessage, Serialized } from '@rocket.chat/core-typings';
import ReactPDF, { Page, Text, View, Document, StyleSheet, Font, Image } from '@react-pdf/renderer';

import { Header } from './components/Header';

export type OmnichannelData = {
	header: {
		agent: ILivechatAgent;
		visitor: ILivechatVisitor;
		siteName: string;
		date: Date;
		time: Date;
	};
	body: (Serialized<Omit<Pick<IMessage, 'msg' | 'u' | 'ts'>, 'files'>> & { files?: { name?: string; buffer: Buffer | null }[] })[];
};

export const isOmnichannelData = (data: any): data is OmnichannelData => {
	return (
		'header' in data &&
		'body' in data &&
		'agent' in data.header &&
		'visitor' in data.header &&
		'siteName' in data.header &&
		'date' in data.header &&
		'time' in data.header
	);
};

const FONT_PATH = `${__dirname}/../../../src/assets/fonts`;

Font.register({
	family: 'Inter',
	fonts: [
		{ src: `${FONT_PATH}/inter400.ttf` },
		{ src: `${FONT_PATH}/inter500.ttf`, fontWeight: 500 },
		{ src: `${FONT_PATH}/inter700.ttf`, fontWeight: 700 },
	],
});

const styles = StyleSheet.create({
	page: {
		fontFamily: 'Inter',
		lineHeight: 1.25,
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

const OmnichannelTranscript = ({ header, body }: OmnichannelData) => (
	<Document>
		<Page size='A4' style={styles.page}>
			<Header
				title={header.siteName}
				subtitle='Chat Transcript'
				values={[
					{ key: 'Agent: ', value: header.agent?.name || header.agent?.username || 'Omnichannel Agent' },
					{ key: 'Date: ', value: `${header.date}` },
					{ key: 'Customer: ', value: header.visitor.name || header.visitor.username },
					{ key: 'Time: ', value: `${header.time}` },
				]}
			/>
			<View style={styles.wrapper}>
				{body.map((message, index) => (
					<View style={styles.message} key={index}>
						<View style={{ flexDirection: 'row' }}>
							<Text style={{ fontWeight: 'bold' }}>{message.u.name}</Text>
							<Text style={{ marginLeft: 10, color: '#9e9e9e' }}>{`${message.ts}`}</Text>
						</View>
						<View style={{ marginTop: 10, flexDirection: 'column' }}>
							<Text>{message.msg}</Text>
						</View>
						{message.files?.map((attachment, index) => (
							<View style={{ marginTop: 10, flexDirection: 'column' }} key={index}>
								<Text style={{ color: '#9e9e9e', marginBottom: 0 }}>{attachment?.name}</Text>
								{/* When buffer is received, that means the image is valid (already checked by service) and the buffer is complete */}
								{attachment.buffer ? (
									// IMPORTANT: Buffer.from is a required step to get the image to work
									// Since the buffer we receive here is a Uint8Array, we need to convert it to a Buffer
									// Otherwise the lib will just put a blank box where the image should be
									<Image style={{ width: 200 }} src={Buffer.from(attachment.buffer)} />
								) : (
									<Text>This attachment is not supported</Text>
								)}
							</View>
						))}
					</View>
				))}
			</View>
		</Page>
	</Document>
);

export default async (data: OmnichannelData): Promise<NodeJS.ReadableStream> => {
	return ReactPDF.renderToStream(<OmnichannelTranscript {...data} />);
};
