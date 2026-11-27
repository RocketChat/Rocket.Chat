import { ScrollView, Text, View } from 'react-native';

import { runSharedModulesProbe } from './sharedModulesProbe';

const rows = runSharedModulesProbe();

export function SharedProbeScreen() {
	return (
		<ScrollView style={{ flex: 1, paddingTop: 60 }} contentContainerStyle={{ padding: 12, gap: 6 }}>
			<Text style={{ fontWeight: '700' }}>
				Shared composer modules: {rows.filter((row) => row.loaded).length}/{rows.length} load
			</Text>
			{rows.map((row) => (
				<View key={row.name} style={{ flexDirection: 'row', gap: 8 }}>
					<Text style={{ color: row.loaded ? '#1a7f37' : '#cf222e', fontWeight: '700' }}>{row.loaded ? 'OK' : 'NO'}</Text>
					<View style={{ flex: 1 }}>
						<Text style={{ fontWeight: '600', fontSize: 13 }}>{row.name}</Text>
						{row.error ? (
							<Text style={{ fontSize: 11 }} numberOfLines={3}>
								{row.error}
							</Text>
						) : null}
					</View>
				</View>
			))}
		</ScrollView>
	);
}
