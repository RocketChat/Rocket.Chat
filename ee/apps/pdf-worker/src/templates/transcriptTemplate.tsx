import React from 'react';
import ReactPDF, { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';

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

const messages = [
	{
		user: 'Christian Castro',
		ts: 'Nov 21, 2022 11:00 AM',
		msg: 'Hello, how can I help you?',
	},
	{
		user: 'Juanito Verdulero De Ponce',
		ts: 'Nov 21, 2022 11:00 AM',
		msg: 'Hello, Im having issues with my credit card',
	},
	{
		user: 'Christian Castro',
		ts: 'Nov 21, 2022 11:00 AM',
		msg: 'Can you please tell me what is the problem?',
	},
	{
		user: 'Juanito Verdulero De Ponce',
		ts: 'Nov 21, 2022 11:00 AM',
		msg: 'I cant pay my bills',
		attachments: [
			{
				name: 'image.png',
				url: './logo.png',
			},
		],
	},
	{
		user: 'Christian Castro',
		ts: 'Nov 21, 2022 11:00 AM',
		msg: 'Thats sad to hear, unfortunately, we cannot help you with that problem :(',
	},
	{
		user: 'Christian Castro',
		ts: 'Nov 21, 2022 12:00 AM',
		msg: 'But, we can offer you financial help with other stuff on board, have you ever thought of adding a widget to your website to promote your business and foster the communication with your customers?',
	},
	{
		user: 'Juanito Verdulero De Ponce',
		ts: 'Nov 21, 2022 11:00 AM',
		msg: 'Jesus, why i didnt thought of this before? Im gonna do it right now!',
		attachments: [
			{
				name: 'image.png',
				url: './logo.png',
			},
		],
	},
	{
		user: 'Christian Castro',
		ts: 'Nov 21, 2022 11:00 AM',
		msg: 'Maybe because you are not a rocket scientist like me :)',
	},
	{
		user: 'Christian Castro',
		ts: 'Nov 21, 2022 11:00 AM',
		msg: 'Yeah, thats true, im not that smart, but i can still use the widget to promote my business, right?',
	},
	{
		user: 'Juanito Verdulero De Ponce',
		ts: 'Nov 21, 2022 11:00 AM',
		msg: 'Of course, you can do it right now, just go to https://rocket.chat and click on the button "Add to your website"',
	},
	{
		user: 'Christian Castro',
		ts: 'Nov 21, 2022 11:00 AM',
		msg: 'Yeah, but, can I also use some custom logo over there? I want to use this one',
		attachments: [
			{
				name: 'moneylogo.png',
				url: './moneylogo.png',
			},
		],
	},
	{
		user: 'Juanito Verdulero De Ponce',
		ts: 'Nov 21, 2022 11:00 AM',
		msg: 'Of course, you can do it right now, just go to https://rocket.chat and click on the button "Add to your website"',
	},
	{
		user: 'Christian Castro',
		ts: 'Nov 21, 2022 11:00 AM',
		// msg with a 1000 words lorem
		msg: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec auctor, nisl eget ultricies lacinia, nisl nisl aliquet nisl, eget aliquet nisl nisl eget nisl. Donec auctor, nisl eget ultricies lacinia, nisl nisl aliquet nisl, eget aliquet nisl nisl eget nisl. Donec auctor, nisl eget ultricies lacinia, nisl nisl aliquet nisl, eget aliquet nisl nisl eget nisl. Donec auctor, nisl eget ultricies lacinia, nisl nisl aliquet nisl, eget aliquet nisl nisl eget nisl. Donec auctor, nisl eget ultricies lacinia, nisl nisl aliquet nisl, eget aliquet nisl nisl eget nisl. Donec auctor, nisl eget ultricies lacinia, nisl nisl aliquet nisl, eget aliquet nisl nisl eget nisl. Donec auctor, nisl eget ultricies lacinia, nisl nisl aliquet nisl, eget aliquet nisl nisl eget nisl. Donec auctor, nisl eget ultricies lacinia, nisl nisl aliquet nisl, eget aliquet nisl nisl eget nisl. Donec auctor, nisl eget ultricies lacinia, nisl nisl aliquet nisl, eget aliquet nisl nisl eget nisl. Donec auctor, nisl eget ultricies lacinia, nisl nisl aliquet nisl, eget aliquet nisl nisl eget nisl. Donec auctor, nisl eget ultricies lacinia, nisl nisl aliquet nisl, eget aliquet nisl nisl eget nisl. Donec auctor, nisl eget ultricies lacinia, nisl nisl aliquet nisl, eget aliquet nisl nisl eget nisl. Donec auctor, nisl eget ultricies lacinia, nisl nisl aliquet nisl, eget aliquet nisl nisl eget nisl. Donec auctor, nisl eget ultricies lacinia, nisl nisl aliquet nisl, eget aliquet nisl nisl eget nisl. Donec auctor, nisl eget ultr',
	},
	{
		user: 'Christian Castro',
		ts: 'Nov 21, 2022 11:00 AM',
		// msg with a 1000 words lorem
		msg: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec auctor, nisl eget ultricies lacinia, nisl nisl aliquet nisl, eget aliquet nisl nisl eget nisl. Donec auctor, nisl eget ultricies lacinia, nisl nisl aliquet nisl, eget aliquet nisl nisl eget nisl. Donec auctor, nisl eget ultricies lacinia, nisl nisl aliquet nisl, eget aliquet nisl nisl eget nisl. Donec auctor, nisl eget ultricies lacinia, nisl nisl aliquet nisl, eget aliquet nisl nisl eget nisl. Donec auctor, nisl eget ultricies lacinia, nisl nisl aliquet nisl, eget aliquet nisl nisl eget nisl. Donec auctor, nisl eget ultricies lacinia, nisl nisl aliquet nisl, eget aliquet nisl nisl eget nisl. Donec auctor, nisl eget ultricies lacinia, nisl nisl aliquet nisl, eget aliquet nisl nisl eget nisl. Donec auctor, nisl eget ultricies lacinia, nisl nisl aliquet nisl, eget aliquet nisl nisl eget nisl. Donec auctor, nisl eget ultricies lacinia, nisl nisl aliquet nisl, eget aliquet nisl nisl eget nisl. Donec auctor, nisl eget ultricies lacinia, nisl nisl aliquet nisl, eget aliquet nisl nisl eget nisl. Donec auctor, nisl eget ultricies lacinia, nisl nisl aliquet nisl, eget aliquet nisl nisl eget nisl. Donec auctor, nisl eget ultricies lacinia, nisl nisl aliquet nisl, eget aliquet nisl nisl eget nisl. Donec auctor, nisl eget ultricies lacinia, nisl nisl aliquet nisl, eget aliquet nisl nisl eget nisl. Donec auctor, nisl eget ultricies lacinia, nisl nisl aliquet nisl, eget aliquet nisl nisl eget nisl. Donec auctor, nisl eget ultr',
	},
	{
		user: 'Christian Castro',
		ts: 'Nov 21, 2022 11:00 AM',
		// msg with a 1000 words lorem
		msg: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec auctor, nisl eget ultricies lacinia, nisl nisl aliquet nisl, eget aliquet nisl nisl eget nisl. Donec auctor, nisl eget ultricies lacinia, nisl nisl aliquet nisl, eget aliquet nisl nisl eget nisl. Donec auctor, nisl eget ultricies lacinia, nisl nisl aliquet nisl, eget aliquet nisl nisl eget nisl. Donec auctor, nisl eget ultricies lacinia, nisl nisl aliquet nisl, eget aliquet nisl nisl eget nisl. Donec auctor, nisl eget ultricies lacinia, nisl nisl aliquet nisl, eget aliquet nisl nisl eget nisl. Donec auctor, nisl eget ultricies lacinia, nisl nisl aliquet nisl, eget aliquet nisl nisl eget nisl. Donec auctor, nisl eget ultricies lacinia, nisl nisl aliquet nisl, eget aliquet nisl nisl eget nisl. Donec auctor, nisl eget ultricies lacinia, nisl nisl aliquet nisl, eget aliquet nisl nisl eget nisl. Donec auctor, nisl eget ultricies lacinia, nisl nisl aliquet nisl, eget aliquet nisl nisl eget nisl. Donec auctor, nisl eget ultricies lacinia, nisl nisl aliquet nisl, eget aliquet nisl nisl eget nisl. Donec auctor, nisl eget ultricies lacinia, nisl nisl aliquet nisl, eget aliquet nisl nisl eget nisl. Donec auctor, nisl eget ultricies lacinia, nisl nisl aliquet nisl, eget aliquet nisl nisl eget nisl. Donec auctor, nisl eget ultricies lacinia, nisl nisl aliquet nisl, eget aliquet nisl nisl eget nisl. Donec auctor, nisl eget ultricies lacinia, nisl nisl aliquet nisl, eget aliquet nisl nisl eget nisl. Donec auctor, nisl eget ultr',
	},
	{
		user: 'Christian Castro',
		ts: 'Nov 21, 2022 11:00 AM',
		// msg with a 1000 words lorem
		msg: 'Lorem ipsum dolor sit amet ame amet amet amet amet amet amet amet amet amet amet amet amet, consectetur adipiscing elit. Donec auctor, nisl eget ultricies lacinia, nisl nisl aliquet nisl, eget aliquet nisl nisl eget nisl. Donec auctor, nisl eget ultricies lacinia, nisl nisl aliquet nisl, eget aliquet nisl nisl eget nisl. Donec auctor, nisl eget ultricies lacinia, nisl nisl aliquet nisl, eget aliquet nisl nisl eget nisl. Donec auctor, nisl eget ultricies lacinia, nisl nisl aliquet nisl, eget aliquet nisl nisl eget nisl. Donec auctor, nisl eget ultricies lacinia, nisl nisl aliquet nisl, eget aliquet nisl nisl eget nisl. Donec auctor, nisl eget ultricies lacinia, nisl nisl aliquet nisl, eget aliquet nisl nisl eget nisl. Donec auctor, nisl eget ultricies lacinia, nisl nisl aliquet nisl, eget aliquet nisl nisl eget nisl. Donec auctor, nisl eget ultricies lacinia, nisl nisl aliquet nisl, eget aliquet nisl nisl eget nisl. Donec auctor, nisl eget ultricies lacinia, nisl nisl aliquet nisl, eget aliquet nisl nisl eget nisl. Donec auctor, nisl eget ultricies lacinia, nisl nisl aliquet nisl, eget aliquet nisl nisl eget nisl. Donec auctor, nisl eget ultricies lacinia, nisl nisl aliquet nisl, eget aliquet nisl nisl eget nisl. Donec auctor, nisl eget ultricies lacinia, nisl nisl aliquet nisl, eget aliquet nisl nisl eget nisl. Donec auctor, nisl eget ultricies lacinia, nisl nisl aliquet nisl, eget aliquet nisl nisl eget nisl. Donec auctor, nisl eget ultricies lacinia, nisl nisl aliquet nisl, eget aliquet nisl nisl eget nisl. Donec auctor, nisl eget ultr',
	},
	{
		user: 'Christian Castro',
		ts: 'Nov 21, 2022 11:00 AM',
		// msg with a 1000 words lorem
		msg: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec auctor, nisl eget ultricies lacinia, nisl nisl aliquet nisl, eget aliquet nisl nisl eget nisl. Donec auctor, nisl eget ultricies lacinia, nisl nisl aliquet nisl, eget aliquet nisl nisl eget nisl. Donec auctor, nisl eget ultricies lacinia, nisl nisl aliquet nisl, eget aliquet nisl nisl eget nisl. Donec auctor, nisl eget ultricies lacinia, nisl nisl aliquet nisl, eget aliquet nisl nisl eget nisl. Donec auctor, nisl eget ultricies lacinia, nisl nisl aliquet nisl, eget aliquet nisl nisl eget nisl. Donec auctor, nisl eget ultricies lacinia, nisl nisl aliquet nisl, eget aliquet nisl nisl eget nisl. Donec auctor, nisl eget ultricies lacinia, nisl nisl aliquet nisl, eget aliquet nisl nisl eget nisl. Donec auctor, nisl eget ultricies lacinia, nisl nisl aliquet nisl, eget aliquet nisl nisl eget nisl. Donec auctor, nisl eget ultricies lacinia, nisl nisl aliquet nisl, eget aliquet nisl nisl eget nisl. Donec auctor, nisl eget ultricies lacinia, nisl nisl aliquet nisl, eget aliquet nisl nisl eget nisl. Donec auctor, nisl eget ultricies lacinia, nisl nisl aliquet nisl, eget aliquet nisl nisl eget nisl. Donec auctor, nisl eget ultricies lacinia, nisl nisl aliquet nisl, eget aliquet nisl nisl eget nisl. Donec auctor, nisl eget ultricies lacinia, nisl nisl aliquet nisl, eget aliquet nisl nisl eget nisl. Donec auctor, nisl eget ultricies lacinia, nisl nisl aliquet nisl, eget aliquet nisl nisl eget nisl. Donec auctor, nisl eget ultr',
	},
	{
		user: 'Christian Castro',
		ts: 'Nov 21, 2022 11:00 AM',
		msg: 'Yeah, but, can I also use some custom logo over there? I want to use this one',
		attachments: [
			{
				name: 'moneylogo.png',
				url: './moneylogo.png',
			},
		],
	},
	{
		user: 'Christian Castro',
		ts: 'Nov 21, 2022 11:00 AM',
		msg: 'Yeah, but, can I also use some custom logo over there? I want to use this one',
		attachments: [
			{
				name: 'moneylogo.png',
				url: './moneylogo.png',
			},
		],
	},
	{
		user: 'Christian Castro',
		ts: 'Nov 21, 2022 11:00 AM',
		msg: 'Yeah, but, can I also use some custom logo over there? I want to use this one',
		attachments: [
			{
				name: 'moneylogo.png',
				url: './moneylogo.png',
			},
		],
	},
];

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
const OmnichannelTranscript = (_data: any) => (
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
								{ key: 'Agent: ', value: 'Christian Castro' },
								{ key: 'Date: ', value: 'Nov 21, 2022' },
							]}
						/>
						<InvoiceTableHeader
							values={[
								{ key: 'Customer: ', value: 'Juanito Verdulero de Ponce' },
								{ key: 'Time: ', value: '11:00 AM' },
							]}
						/>
					</View>
				</div>
				<div>
					<View style={styles.messagesContainer}>
						{messages.map((message, index) => (
							<View style={styles.message} id={`${index}`}>
								<View style={{ flexDirection: 'row' }}>
									<Text style={{ fontWeight: 'bold' }}>{message.user}</Text>
									<Text style={{ marginLeft: 10, color: '#9e9e9e' }}>{message.ts}</Text>
								</View>
								<View style={{ marginTop: 10, flexDirection: 'column' }}>
									<Text>{message.msg}</Text>
								</View>
								{/* {message.attachments?.map((attachment, index) => (
									<View style={{ marginTop: 10, flexDirection: 'column' }} id={`attachment-${index}`}>
										<Text style={{ color: '#9e9e9e', marginBottom: 0 }}>{attachment.name}</Text>
										<Image style={{ width: 200 }} src={attachment.url} />
									</View>
								))} */}
							</View>
						))}
					</View>
				</div>
			</View>
		</Page>
	</Document>
);

export default async (data: any): Promise<NodeJS.ReadableStream> => {
	return ReactPDF.renderToStream(<OmnichannelTranscript {...{ data }} />);
};
