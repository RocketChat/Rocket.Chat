import { Document, Page, StyleSheet } from '@react-pdf/renderer';

import type { OmnichannelData } from '..';
import { Header } from './Header';
import { Messages } from './Messages';

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

export const OmnichannelTranscript = ({ header, body }: OmnichannelData) => (
	<Document>
		<Page size='A4' style={styles.page}>
			<Header
				title={header.siteName}
				subtitle='Chat transcript'
				values={[
					{ key: 'Agent: ', value: header.agent?.name || header.agent?.username || 'Omnichannel Agent' },
					{ key: 'Date: ', value: `${header.date}` },
					{ key: 'Customer: ', value: header.visitor.name || header.visitor.username },
					{ key: 'Time: ', value: `${header.time}` },
				]}
			/>
			<Messages body={body} />
		</Page>
	</Document>
);
