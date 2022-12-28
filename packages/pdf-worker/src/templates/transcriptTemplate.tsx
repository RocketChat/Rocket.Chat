import type { ILivechatAgent, ILivechatVisitor, IMessage, Serialized } from '@rocket.chat/core-typings';
import ReactPDF, { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';

export type OmnichannelData = {
	header: {
		agent: ILivechatAgent;
		visitor: ILivechatVisitor;
		closedAt: Date;
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
		'closedAt' in data.header &&
		'timezone' in data.header
	);
};

const styles = StyleSheet.create({
	page: {
		flexDirection: 'column',
		backgroundColor: '#F7F8FA',
		display: 'flex',
		justifyContent: 'center',
		paddingTop: 20,
		paddingBottom: 20,
	},
	section: {
		margin: 10,
		padding: 10,
		flexGrow: 1,
	},
	logo: {
		marginVertical: 15,
		marginHorizontal: 100,
		height: 50,
		width: 50,
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'flex-start',
		width: '100%',
		margin: 5,
	},
	tableContainer: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		marginTop: 10,
		borderWidth: 0,
		marginLeft: 5,
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

const styles2 = StyleSheet.create({
	container: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		height: 25,
		textAlign: 'left',
		flexGrow: 1,
		fontSize: 18,
		width: '90%',
	},
	description: {
		paddingLeft: 8,
	},
});

const InvoiceTableHeader = ({ values }: { values: { key: string; value: string }[] }) => (
	<View style={styles2.container}>
		<Text style={{ ...styles2.description, width: '60%' }}>
			<strong>
				<Text>{values[0].key}</Text>
			</strong>
			{values[0].value}
		</Text>
		<Text style={{ ...styles2.description, width: '40%' }}>
			<strong>
				<Text>{values[1].key}</Text>
			</strong>
			{values[1].value}
		</Text>
	</View>
);

// Create Document Component
const OmnichannelTranscript = ({ header, body }: OmnichannelData) => (
	<Document>
		<Page size='A4' style={styles.page}>
			<View style={styles.section}>
				<div>
					<header style={styles.header}>
						{/* <Image style={styles.logo} src='logo.png' /> */}
						<View style={{ flexDirection: 'column' }}>
							<Text>Rocket.Chat</Text>
							<Text>Chat Transcript</Text>
						</View>
					</header>
				</div>
				<div>
					<View style={styles.tableContainer}>
						<InvoiceTableHeader
							values={[
								{ key: 'Agent: ', value: header.agent?.name || header.agent?.username || 'Omnichannel Agent' },
								{ key: 'Date: ', value: `${header.closedAt}` },
							]}
						/>
						<InvoiceTableHeader
							values={[
								{ key: 'Customer: ', value: header.visitor.username },
								{ key: 'Time: ', value: `${header.closedAt}` },
							]}
						/>
					</View>
				</div>
				<div>
					{/* Leaving this rendering as an example of how the data comes
						We get the messages from `body` and we can do whatever we want with them.
						Messages are a simplified version of IMessage, containing only msg, ts, u and files (if any)
					*/}
					<View style={styles.messagesContainer}>
						{body.map((message, index) => (
							<View style={styles.message} id={`${index}`}>
								<View style={{ flexDirection: 'row' }}>
									<Text style={{ fontWeight: 'bold' }}>{message.u.username}</Text>
									{/* closedAt date will come as an actual date, and reactpdf doesnt like it so remember to parse it before passing to Text*/}
									<Text style={{ marginLeft: 10, color: '#9e9e9e' }}>{`${message.ts}`}</Text>
								</View>
								<View style={{ marginTop: 10, flexDirection: 'column' }}>
									<Text>{message.msg}</Text>
								</View>
								{message.files?.map((attachment, index) => (
									<View style={{ marginTop: 10, flexDirection: 'column' }} id={`attachment-${index}`}>
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
				</div>
			</View>
		</Page>
	</Document>
);

export default async (data: OmnichannelData): Promise<NodeJS.ReadableStream> => {
	return ReactPDF.renderToStream(<OmnichannelTranscript {...data} />);
};
