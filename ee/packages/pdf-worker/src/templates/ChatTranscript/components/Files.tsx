import { View, StyleSheet, Text, Image } from '@react-pdf/renderer';
import colors from '@rocket.chat/fuselage-tokens/colors.json';
import { fontScales } from '@rocket.chat/fuselage-tokens/typography.json';

import type { PDFFile } from '..';

const styles = StyleSheet.create({
	file: {
		color: colors.n700,
		marginTop: 4,
		flexDirection: 'column',
		fontSize: fontScales.c1.fontSize,
	},
	image: {
		width: 400,
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
	<View wrap={false}>
		{files?.map((file, index) => (
			<View style={styles.file} key={index}>
				<Text>{file.name}</Text>
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
