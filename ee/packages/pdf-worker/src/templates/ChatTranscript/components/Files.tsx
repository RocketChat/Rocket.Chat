import { Buffer } from 'buffer';

import { View, StyleSheet, Text, Image } from '@react-pdf/renderer';
import colors from '@rocket.chat/fuselage-tokens/colors.json';
import { fontScales } from '@rocket.chat/fuselage-tokens/typography.json';

import type { PDFFile } from '../../../types/ChatTranscriptData';

const styles = StyleSheet.create({
	container: {
		marginTop: 8,
		width: '100%',
	},
	file: {
		color: colors.n700,
		marginBottom: 16,
		flexDirection: 'column',
		fontSize: fontScales.c1.fontSize,
		width: '100%',
	},
	fileName: {
		marginBottom: 6,
	},
	image: {
		width: '100%',
		maxHeight: 240,
		objectFit: 'contain',
		objectPosition: '0',
	},
	invalidMessage: {
		backgroundColor: colors.n100,
		textAlign: 'center',
		borderColor: colors.n250,
		borderWidth: 1,
		borderRadius: 4,
		paddingVertical: 8,
		marginTop: 4,
	},
});

export const Files = ({ files, invalidMessage }: { files: PDFFile[]; invalidMessage: string }) => (
	<View style={styles.container}>
		{files?.map((file, index) => (
			<View style={styles.file} key={index} wrap>
				<Text style={styles.fileName}>{file.name}</Text>
				{file.buffer ? (
					// Cache = false is required to avoid a bug in react-pdf
					// Which causes the image to be duplicated when using buffers because of bad caching
					// https://github.com/diegomura/react-pdf/issues/1805
					<Image style={styles.image} src={Buffer.from(file.buffer)} cache={false} />
				) : (
					<Text style={styles.invalidMessage}>{invalidMessage}</Text>
				)}
			</View>
		))}
	</View>
);
