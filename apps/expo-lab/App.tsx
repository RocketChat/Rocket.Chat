import { Avatar, Badge, Button } from '@rocket.chat/fuselage';
import '@tamagui/core';
import { TamaguiProvider } from '@tamagui/web';
import { View } from 'react-native';

import { tamaguiConfig } from '../../packages/fuselage/src/tamagui.config';

export default function App() {
	return (
		// @ts-expect-error two @tamagui/web copies (root, app) make the config types incompatible
		<TamaguiProvider config={tamaguiConfig} defaultTheme='light'>
			<View style={{ flex: 1, paddingTop: 96, alignItems: 'center', gap: 16 }}>
				<Badge variant='primary'>3</Badge>
				<Button variant='primary'>Send</Button>
				<Avatar size='x36' alt='Ada' url='https://open.rocket.chat/avatar/ada' />
			</View>
		</TamaguiProvider>
	);
}
