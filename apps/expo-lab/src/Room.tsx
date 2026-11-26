import { useEffect, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Text as RNText, TextInput, View } from 'react-native';
import { Button, XStack, YStack } from 'tamagui';

import { isHttpError, loadHistory, sendMessage, type ChatMessage, type RoomItem } from './api';
import type { Session } from './session';

type Props = { session: Session; room: RoomItem; onBack: () => void };

const errorText = (e: unknown) => (isHttpError(e) ? `HTTP ${e.status}` : e instanceof Error ? e.message : String(e));

export function Room({ session, room, onBack }: Props) {
	// Newest first, rendered by an inverted list.
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [draft, setDraft] = useState('');
	const [error, setError] = useState<string>();
	const [live, setLive] = useState(false);

	useEffect(() => {
		let active = true;
		const upsert = (m: ChatMessage) =>
			setMessages((prev) => (prev.some((p) => p._id === m._id) ? prev.map((p) => (p._id === m._id ? m : p)) : [m, ...prev]));

		// Subscribe before loading history so nothing sent in between is missed; upsert dedupes.
		const sub = session.sdk.stream('room-messages', room.rid, (m) => upsert(m as unknown as ChatMessage));
		sub.ready().then(
			() => active && setLive(true),
			(e) => setError(errorText(e)),
		);
		loadHistory(session, room).then(
			(history) => active && setMessages((prev) => [...prev, ...history.filter((h) => !prev.some((p) => p._id === h._id))]),
			(e) => setError(errorText(e)),
		);
		return () => {
			active = false;
			sub.stop();
		};
	}, [session, room]);

	const send = async () => {
		const msg = draft.trim();
		if (!msg) return;
		setDraft('');
		try {
			await sendMessage(session, room.rid, msg);
		} catch (e) {
			setError(errorText(e));
			setDraft(msg);
		}
	};

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
