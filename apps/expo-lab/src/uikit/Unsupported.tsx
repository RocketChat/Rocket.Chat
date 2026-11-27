import { Text } from 'react-native';

// Dev-only marker for a block or element this renderer does not draw yet; nothing in release
export function Unsupported({ type }: { type: string }) {
	if (!__DEV__) return null;

	return (
		<Text style={{ fontSize: 11, color: '#9b2c2c', backgroundColor: '#fff5f5', borderColor: '#feb2b2', borderWidth: 1, borderRadius: 4, padding: 4, alignSelf: 'flex-start' }}>
			not supported yet: {type}
		</Text>
	);
}
