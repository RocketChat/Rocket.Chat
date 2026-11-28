import { TamaguiProvider } from '@tamagui/web';
import { useFonts } from 'expo-font';
import type { ReactNode } from 'react';
import { LogBox, Pressable, Text, View } from 'react-native';

import { tamaguiConfig } from '../../../packages/fuselage/src/tamagui.config';
import iconFont from '../../../packages/icons/dist/font/rocketchat.ttf';

// A component that throws is the finding, shown inline by its error boundary; the dev overlay would cover it
LogBox.ignoreAllLogs();

type Props = { title: string; onBack: () => void; children: ReactNode };

// The icon font is what Icon names as fontFamily; the web gets it from rocketchat.css, native has to load it
export function FuselageHost({ title, onBack, children }: Props) {
	const [fontsReady] = useFonts({ RocketChat: iconFont });

	if (!fontsReady) return null;

	return (
		<TamaguiProvider config={tamaguiConfig} defaultTheme='light'>
			<View style={{ flex: 1, paddingTop: 64, paddingHorizontal: 16 }}>
				<Pressable onPress={onBack} testID='back'>
					<Text style={{ fontSize: 16, paddingBottom: 4 }}>{`< Back  ${title}`}</Text>
				</Pressable>
				{children}
			</View>
		</TamaguiProvider>
	);
}
