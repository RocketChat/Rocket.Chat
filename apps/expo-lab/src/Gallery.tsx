import type { ComponentProps } from 'react';
import { LogBox, Text as RNText, ScrollView, Pressable, View } from 'react-native';
import { useFonts } from 'expo-font';
import { TamaguiProvider } from 'tamagui';
import '@tamagui/core';

import { tamaguiConfig } from '../../../packages/fuselage/src/tamagui.config';
import { Content } from './GalleryContent';

// The probes show each caught error inline; the dev overlay would cover them
LogBox.ignoreAllLogs();

// Two @tamagui/web type copies make the config type differ
type ProviderConfig = ComponentProps<typeof TamaguiProvider>['config'];

// The icon font Icon names as fontFamily; the web gets it from rocketchat.css, native has to load it
const iconFont = { RocketChat: require('../../../packages/icons/dist/font/rocketchat.ttf') as number };

export function Gallery({ onBack }: { onBack: () => void }) {
	const [fontsReady] = useFonts(iconFont);

	if (!fontsReady) return null;

	return (
		<TamaguiProvider
			config={tamaguiConfig as ProviderConfig}
			defaultTheme='light'
		>
			<View style={{ flex: 1, paddingTop: 64, paddingHorizontal: 16 }}>
				<Pressable onPress={onBack} testID='gallery-back'>
					<RNText style={{ fontSize: 16, paddingBottom: 8 }}>{'< Back'}</RNText>
				</Pressable>
				<ScrollView style={{ flex: 1 }} contentInsetAdjustmentBehavior='never' contentOffset={{ x: 0, y: Number(process.env.EXPO_PUBLIC_GALLERY_SCROLL ?? 0) }}>
					<Content />
				</ScrollView>
			</View>
		</TamaguiProvider>
	);
}
