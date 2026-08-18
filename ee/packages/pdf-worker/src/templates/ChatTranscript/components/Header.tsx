import { Text, View, StyleSheet } from '@react-pdf/renderer';
import colors from '@rocket.chat/fuselage-tokens/dist/colors.json';
import { fontScale } from '@rocket.chat/fuselage-tokens/dist/typography.json';

const styles = StyleSheet.create({
	header: {
		padding: 32,
		borderRadius: 4,
		backgroundColor: colors.n100,
		marginBottom: 16,
	},
	headerText: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		borderBottomColor: colors.n200,
		borderBottomWidth: 2,
		marginBottom: 16,
		paddingBottom: 16,
		color: colors.n900,
	},
	pagination: {
		fontSize: fontScale.c1.fontSize,
		color: colors.n700,
	},
	title: {
		fontSize: fontScale.h4.fontSize,
		fontWeight: fontScale.h4.fontWeight,
	},
	subtitle: {
		fontSize: fontScale.p2m.fontSize,
		fontWeight: fontScale.p2m.fontWeight,
		color: colors.n900,
	},
	container: {
		fontSize: fontScale.c1.fontSize,
		flexDirection: 'row',
		flexWrap: 'wrap',
	},
	item: {
		paddingTop: 8,
		paddingRight: 10,
		flexGrow: 1,
		flexShrink: 1,
		width: '50%',
	},
	key: {
		fontWeight: fontScale.c2.fontWeight,
	},
});

export type HeaderProps = { title: string; subtitle: string; values: { key: string; value: string }[] };

export const Header = ({ title, subtitle, values }: HeaderProps) => (
	<View style={styles.header} fixed>
		<View style={styles.headerText}>
			<Text style={styles.title}>{title}</Text>
			<Text style={styles.pagination} render={({ pageNumber, totalPages }) => `${pageNumber}/${totalPages}`} />
		</View>
		<Text style={styles.subtitle}>{subtitle}</Text>
		<View style={styles.container}>
			{values.map((value, index) => (
				<Text style={styles.item} key={index}>
					<Text style={styles.key}>{value.key}: </Text>
					<Text>{value.value}</Text>
				</Text>
			))}
		</View>
	</View>
);
