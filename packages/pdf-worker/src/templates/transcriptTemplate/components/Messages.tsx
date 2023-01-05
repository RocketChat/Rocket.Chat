import { Text, View, StyleSheet } from '@react-pdf/renderer';
import colors from '@rocket.chat/fuselage-tokens/colors.json';

import type { OmnichannelData } from '..';
import { Divider } from './Divider';

const styles = StyleSheet.create({
	wrapper: {
		paddingHorizontal: 32,
	},
	message: {
		wordWrap: 'break-word',
		fontSize: '12',
		textAlign: 'justify',
	},
	lineWrapper: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: 12,
	},
	line: {
		flex: 1,
		height: 2,
		backgroundColor: colors.n200,
	},
	divider: {
		fontSize: 12,
		fontWeight: 700,
		paddingHorizontal: 8,
	},
});

export const Messages = ({ body }: Pick<OmnichannelData, 'body'>) => (
	<View style={styles.wrapper}>
		{body.map((message, index) => (
			<View key={index}>
				{message.divider && <Divider divider={message.divider} />}
				{message.msg && (
					<View style={styles.message}>
						<View style={{ flexDirection: 'row' }}>
							<Text style={{ fontWeight: 'bold' }}>{message.u.name}</Text>
							<Text style={{ marginLeft: 10, color: '#9e9e9e' }}>{message.ts}</Text>
						</View>
						<View style={{ marginTop: 10, flexDirection: 'column' }}>
							<Text>{message.msg}</Text>
						</View>
					</View>
				)}
			</View>
		))}
	</View>
);
