import type { ComponentProps, ComponentType, ReactNode } from 'react';
import { TamaguiProvider } from 'tamagui';
import '@tamagui/core';
import { TextAreaInput } from '@rocket.chat/fuselage';

import { tamaguiConfig } from '../../../packages/fuselage/src/tamagui.config';

type ProviderConfig = ComponentProps<typeof TamaguiProvider>['config'];

// Props go through untyped on purpose: the probe passes React Native props to a component typed with the web ones
export const FuselageArea = TextAreaInput as unknown as ComponentType<Record<string, unknown>>;

export function FuselageProvider({ children }: { children: ReactNode }) {
	return (
		<TamaguiProvider config={tamaguiConfig as ProviderConfig} defaultTheme='light'>
			{children}
		</TamaguiProvider>
	);
}
