import type { ComponentProps, ReactNode } from 'react';
import { LogBox } from 'react-native';
import { useFonts } from 'expo-font';
import { TamaguiProvider } from 'tamagui';
import '@tamagui/core';

import { tamaguiConfig } from '../../../../packages/fuselage/src/tamagui.config';

// A render error is shown by the screen's own text; the dev overlay would cover it
LogBox.ignoreAllLogs();

// Two @tamagui/web type copies make the config type differ
type ProviderConfig = ComponentProps<typeof TamaguiProvider>['config'];

// The icon font Icon names as fontFamily; the web gets it from rocketchat.css, native has to load it
const iconFont = { RocketChat: require('../../../../packages/icons/dist/font/rocketchat.ttf') as number };

// Loaded on demand, as the gallery is: importing Fuselage registers its own Tamagui config, which the plain screens must not meet
export function FuselageProvider({ children }: { children: ReactNode }) {
	const [fontsReady] = useFonts(iconFont);

	if (!fontsReady) return null;

	return (
		<TamaguiProvider config={tamaguiConfig as ProviderConfig} defaultTheme='light'>
			{children}
		</TamaguiProvider>
	);
}
