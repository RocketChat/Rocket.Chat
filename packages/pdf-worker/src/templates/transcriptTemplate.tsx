import type { ILivechatAgent, ILivechatVisitor, IMessage, Serialized } from '@rocket.chat/core-typings';
import ReactPDF, { Page, Text, View, Document, StyleSheet, Image, Font } from '@react-pdf/renderer';

import { Header } from '../components/Header';

export type OmnichannelData = {
	header: {
		agent: ILivechatAgent;
		visitor: ILivechatVisitor;
		site_name: string;
		date: Date;
		time: Date;
		timezone: string;
	};
	body: (Serialized<Omit<Pick<IMessage, 'msg' | 'u' | 'ts'>, 'files'>> & { files?: { name?: string; buffer: Buffer | null }[] })[];
};

export const isOmnichannelData = (data: any): data is OmnichannelData => {
	return (
		'header' in data &&
		'body' in data &&
		'agent' in data.header &&
		'visitor' in data.header &&
		'site_name' in data.header &&
		'date' in data.header &&
		'time' in data.header &&
		'timezone' in data.header
	);
};

const FONT_PATH = `${__dirname}/../../src/assets/fonts`;

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
	messagesContainer: {
		backgroundColor: '#fff',
		borderRadius: '5px',
		height: '100%',
		marginTop: 30,
		marginBottom: 30,
		width: '100%',
		paddingBottom: 30,
	},
	message: {
		marginLeft: 20,
		marginRight: 20,
		marginTop: 20,
		wordWrap: 'break-word',
		fontSize: '12',
		textAlign: 'justify',
	},
});

const OmnichannelTranscript = ({ header, body }: OmnichannelData) => (
	<Document>
		<Page size='A4' style={styles.page}>
			<Header
				title={header.site_name}
				subtitle='Chat Transcript'
				values={[
					{ key: 'Agent: ', value: header.agent?.name || header.agent?.username || 'Omnichannel Agent' },
					{ key: 'Date: ', value: `${header.date}` },
					{ key: 'Customer: ', value: header.visitor.name || header.visitor.username },
					{ key: 'Time: ', value: `${header.time} ${header.timezone}` },
				]}
			/>
			<div>
				{/* Leaving this rendering as an example of how the data comes
						We get the messages from `body` and we can do whatever we want with them.
						Messages are a simplified version of IMessage, containing only msg, ts, u and files (if any)
					*/}
				<View style={styles.messagesContainer}>
					{body.map((message, index) => (
						<View style={styles.message} key={index}>
							<View style={{ flexDirection: 'row' }}>
								<Text style={{ fontWeight: 'bold' }}>{message.u.name}</Text>
								{/* closedAt date will come as an actual date, and reactpdf doesnt like it so remember to parse it before passing to Text*/}
								<Text style={{ marginLeft: 10, color: '#9e9e9e' }}>{`${message.ts}`}</Text>
							</View>
							<View style={{ marginTop: 10, flexDirection: 'column' }}>
								<Text>{message.msg}</Text>
							</View>
							{message.files?.map((attachment, index) => (
								<View style={{ marginTop: 10, flexDirection: 'column' }} id={`attachment-${index}`} key={index}>
									<Text style={{ color: '#9e9e9e', marginBottom: 0 }}>{attachment.name}</Text>
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
			</div>
		</Page>
	</Document>
);

export default async (data: OmnichannelData): Promise<NodeJS.ReadableStream> => {
	return ReactPDF.renderToStream(<OmnichannelTranscript {...data} />);
};
