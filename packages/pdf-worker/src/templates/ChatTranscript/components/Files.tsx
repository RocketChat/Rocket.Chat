import { View, StyleSheet, Text, Image } from '@react-pdf/renderer';
import { fontScales } from '@rocket.chat/fuselage-tokens/typography.json';
import colors from '@rocket.chat/fuselage-tokens/colors.json';

import type { PDFFile } from '..';
import { wrapBuffer } from '../../../utils/buffer';

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
		paddingVertical: 8,
		marginTop: 4,
	},
});

export const Files = ({ files, invalidMessage }: { files: PDFFile[]; invalidMessage: string }) => (
	<View>
		{files?.map((file, index) => (
			<View style={styles.file} key={index}>
				<Text>{file.name}</Text>
				{file.buffer ? (
					<Image style={styles.image} src={wrapBuffer(Buffer.from(file.buffer))} />
				) : (
					<Text style={styles.invalidMessage}>{invalidMessage}</Text>
				)}
			</View>
		))}
	</View>
);
