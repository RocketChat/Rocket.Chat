import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { ErrorCell } from './ErrorCell';

// EXPO_PUBLIC_GALLERY_ONLY=Item,NavBar shows only the cells whose name contains one of them, to look at a part of a long gallery
const only: string[] | undefined = process.env.EXPO_PUBLIC_GALLERY_ONLY?.split(',').filter(Boolean);

export function Cell({ name, children, presses }: { name: string; children: ReactNode; presses?: number }) {
	if (only && !only.some((part) => name.includes(part))) return null;

	return (
		<View style={{ paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#ddd' }}>
			<Text style={{ fontSize: 11, color: '#666', marginBottom: 6 }}>
				{name}
				{presses === undefined ? '' : ` | presses: ${presses}`}
			</Text>
			<ErrorCell>
				<View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>{children}</View>
			</ErrorCell>
		</View>
	);
}
