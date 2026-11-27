import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Gallery } from './src/Gallery';
import { Sweep } from './src/Sweep';

type Screen = 'home' | 'sweep' | 'gallery';

// EXPO_PUBLIC_SWEEP=1 opens the sweep directly, which is how `yarn sweep` drives the app
const initial: Screen = process.env.EXPO_PUBLIC_SWEEP === '1' ? 'sweep' : 'home';

export default function App() {
	const [screen, setScreen] = useState<Screen>(initial);
	const home = () => setScreen('home');

	if (screen === 'sweep') return <Sweep onBack={home} />;
	if (screen === 'gallery') return <Gallery onBack={home} />;

	return (
		<View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 }}>
			<Pressable onPress={() => setScreen('sweep')} testID='open-sweep'>
				<Text style={{ fontSize: 18 }}>Component sweep</Text>
			</Pressable>
			<Pressable onPress={() => setScreen('gallery')} testID='open-gallery'>
				<Text style={{ fontSize: 18 }}>Gallery</Text>
			</Pressable>
		</View>
	);
}
