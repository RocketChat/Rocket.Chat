import { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import type { SmokeRow } from './sharedFlowsSmoke';
import { runFlowsSmoke } from './sharedFlowsSmoke';
import { runSharedModulesProbe } from './sharedModulesProbe';

const rows = runSharedModulesProbe();

export function SharedProbeScreen() {
	const [smoke, setSmoke] = useState<SmokeRow[] | null>(null);
	const [smokeError, setSmokeError] = useState<string | null>(null);

	useEffect(() => {
		runFlowsSmoke().then(setSmoke).catch((e) => setSmokeError(String(e)));
	}, []);

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

			<View style={{ height: 1, backgroundColor: '#d0d7de', marginVertical: 8 }} />

			<Text style={{ fontWeight: '700' }}>
				Flow smoke:{' '}
				{smoke ? `${smoke.filter((r) => r.passed).length}/${smoke.length} pass` : smokeError ? 'error' : 'running…'}
			</Text>
			{smokeError ? (
				<Text style={{ color: '#cf222e', fontSize: 11 }}>{smokeError}</Text>
			) : null}
			{smoke?.map((row) => (
				<View key={row.name} style={{ flexDirection: 'row', gap: 8 }}>
					<Text style={{ color: row.passed ? '#1a7f37' : '#cf222e', fontWeight: '700' }}>
						{row.passed ? 'PASS' : 'FAIL'}
					</Text>
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
