import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Button, TamaguiProvider, Text, Theme, YStack } from 'tamagui';

import { config } from './tamagui.config';

// Token props ($background, $4...) are not typed yet: the nested @tamagui/web copy
// does not receive the TamaguiCustomConfig augmentation. Literal values until that is fixed.
const palette = { light: '#ffffff', dark: '#111111' } as const;
const text = { light: '#111111', dark: '#ffffff' } as const;

export default function App() {
	const [scheme, setScheme] = useState<'light' | 'dark'>('light');
	const next = scheme === 'light' ? 'dark' : 'light';

	return (
		<TamaguiProvider config={config} defaultTheme={scheme}>
			<Theme name={scheme}>
				<YStack flex={1} alignItems='center' justifyContent='center' gap={16} backgroundColor={palette[scheme]}>
					<Text color={text[scheme]} fontSize={24}>
						Rocket.Chat expo-lab
					</Text>
					<Button onPress={() => setScheme(next)}>Switch to {next}</Button>
				</YStack>
				<StatusBar style={scheme === 'light' ? 'dark' : 'light'} />
			</Theme>
		</TamaguiProvider>
	);
}
