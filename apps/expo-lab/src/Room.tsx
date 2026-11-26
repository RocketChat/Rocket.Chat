import { FlatList, KeyboardAvoidingView, Platform, Text as RNText, TextInput, View } from 'react-native';
import { Button, XStack, YStack } from 'tamagui';

import type { RoomItem } from './api';
import type { Session } from './session';
import { useRoom } from './useRoom';

type Props = { session: Session; room: RoomItem; onBack: () => void };

export function Room({ session, room, onBack }: Props) {
	const { messages, draft, setDraft, error, live, send } = useRoom(session, room);

	return (
		<KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
			<YStack flex={1} paddingTop={64}>
				<XStack padding={12} gap={12} alignItems='center'>
					<Button onPress={onBack}>
						Back
					</Button>
					<RNText style={{ fontSize: 18, fontWeight: '700' }}>{room.title}</RNText>
					<RNText style={{ color: live ? 'green' : 'gray' }}>{live ? 'live' : '...'}</RNText>
				</XStack>
				{error && <RNText style={{ color: 'crimson', padding: 12 }}>{error}</RNText>}
				<FlatList
					inverted
					data={messages}
					keyExtractor={(m) => m._id}
					renderItem={({ item }) => (
						<View style={{ paddingHorizontal: 12, paddingVertical: 6 }}>
							<RNText style={{ fontWeight: '600' }}>
								{item.u.name || item.u.username}{' '}
								<RNText style={{ fontWeight: '400', color: 'gray', fontSize: 12 }}>{new Date(item.ts).toLocaleTimeString()}</RNText>
							</RNText>
							<RNText>{item.msg}</RNText>
						</View>
					)}
				/>
				<XStack padding={12} gap={8}>
					<TextInput
						style={{ flex: 1, borderWidth: 1, borderColor: '#999', borderRadius: 6, padding: 10, fontSize: 16 }}
						value={draft}
						onChangeText={setDraft}
						placeholder='Message'
						onSubmitEditing={send}
					/>
					<Button onPress={send}>Send</Button>
				</XStack>
			</YStack>
		</KeyboardAvoidingView>
	);
}
