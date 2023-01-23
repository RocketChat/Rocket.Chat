import { Text, View, StyleSheet } from '@react-pdf/renderer';

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
