import { Text, View, StyleSheet } from '@react-pdf/renderer';
import colors from '@rocket.chat/fuselage-tokens/colors.json';
import { fontScales } from '@rocket.chat/fuselage-tokens/typography.json';

const styles = StyleSheet.create({
	header: {
		padding: '32px',
		borderRadius: '4px',
		backgroundColor: colors.n100,
		color: colors.n900,
	},
	title: {
		fontSize: fontScales.h4.fontSize,
		fontWeight: fontScales.h4.fontWeight,
	},
	subtitle: {
		fontSize: fontScales.p2m.fontSize,
		fontWeight: fontScales.p2m.fontWeight,
	},
	row: {
		borderBottomColor: colors.n200,
		borderBottomWidth: '2px',
		margin: '16px 0 16px',
	},
	container: {
		fontSize: fontScales.c1.fontSize,
		flexDirection: 'row',
		flexWrap: 'wrap',
	},
	item: {
		padding: '8px 10px 0 0',
		flexGrow: 1,
		flexShrink: 1,
	},
	key: {
		fontWeight: fontScales.c2.fontWeight,
	},
});

export const Header = ({ title, subtitle, values }: { title: string; subtitle: string; values: { key: string; value: string }[] }) => (
	<View style={styles.header} fixed>
		<Text style={styles.title}>{title}</Text>
		<View style={styles.row} />
		<Text style={styles.subtitle}>{subtitle}</Text>
		<View style={styles.container}>
			{values.map((value, index) => (
				<Text style={{ ...styles.item, width: index % 2 === 0 ? '30%' : '60%' }} key={index}>
					<Text style={styles.key}>{value.key}</Text>
					<Text>{value.value}</Text>
				</Text>
			))}
		</View>
	</View>
);
