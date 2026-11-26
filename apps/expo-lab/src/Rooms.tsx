import { FlatList, Pressable, Text as RNText } from 'react-native';
import { Button, XStack, YStack } from 'tamagui';

import type { RoomItem } from './api';
import type { Session } from './session';
import { useRooms } from './useRooms';

type Props = { session: Session; onOpen: (room: RoomItem) => void; onLogout: () => void };

export function Rooms({ session, onOpen, onLogout }: Props) {
	const { rooms, error } = useRooms(session);

	return (
		<YStack flex={1} paddingTop={64}>
			<XStack padding={12} justifyContent='space-between' alignItems='center'>
				<RNText style={{ fontSize: 20, fontWeight: '700' }}>Rooms</RNText>
				<Button onPress={onLogout}>
					Sign out
				</Button>
			</XStack>
			{error && <RNText style={{ color: 'crimson', padding: 12 }}>{error}</RNText>}
			{!rooms && !error && <RNText style={{ padding: 12 }}>Loading...</RNText>}
			<FlatList
				data={rooms}
				keyExtractor={(r) => r.rid}
				renderItem={({ item }) => (
					<Pressable onPress={() => onOpen(item)} style={{ padding: 14, borderBottomWidth: 1, borderColor: '#ddd' }}>
						<RNText style={{ fontSize: 16 }}>
							{item.t === 'd' ? '@ ' : item.t === 'p' ? 'P ' : '# '}
							{item.title}
							{item.unread ? `  (${item.unread})` : ''}
						</RNText>
					</Pressable>
				)}
			/>
		</YStack>
	);
}
