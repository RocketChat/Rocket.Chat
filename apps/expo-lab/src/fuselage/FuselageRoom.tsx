import type { ReactNode } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Text as RNText, View } from 'react-native';
import {
	Button,
	Message,
	MessageBody,
	MessageContainer,
	MessageHeader,
	MessageLeftContainer,
	MessageName,
	MessageTimestamp,
	MessageUsername,
	TextInput,
} from '@rocket.chat/fuselage';

import { AppAvatar } from '../AppAvatar';
import { userAvatarUrl, type RoomItem } from '../api';
import { mock } from '../chatConfig';
import { EmojiServerContext } from '../markup/Emoji';
import Markup from '../markup/Markup';
import type { Session } from '../session';
import { useRoom } from '../useRoom';

type Props = { session: Session; room: RoomItem; onBack: () => void };

const time = (ts: string) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

// A Fuselage Button takes the width of its row on native, so it is wrapped in a fixed width
const Fit = ({ children }: { children: ReactNode }) => <View style={{ width: 96 }}>{children}</View>;

export function FuselageRoom({ session, room, onBack }: Props) {
	const { messages, draft, setDraft, error, live, send } = useRoom(session, room);

	return (
		<EmojiServerContext.Provider value={mock ? undefined : session.serverUrl}>
		<KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
			<View style={{ flex: 1, paddingTop: 64 }}>
				<View style={{ padding: 12, gap: 12, flexDirection: 'row', alignItems: 'center' }}>
					<Fit>
						<Button onPress={onBack}>Back</Button>
					</Fit>
					<RNText style={{ fontSize: 18, fontWeight: '700', flexShrink: 1 }} numberOfLines={1}>
						{room.title}
					</RNText>
					<RNText style={{ color: live ? 'green' : 'gray' }}>{live ? 'live' : '...'}</RNText>
				</View>
				{error && <RNText style={{ color: 'crimson', padding: 12 }}>{error}</RNText>}
				<FlatList
					inverted
					data={messages}
					keyExtractor={(m) => m._id}
					renderItem={({ item }) => (
						<Message>
							<MessageLeftContainer>
								{/* The web centers the avatar on the header and first body line (min-block-size 40px, scss); native does not run it */}
								<View style={{ height: 40, justifyContent: 'center' }}>
									<AppAvatar url={userAvatarUrl(session, item.u.username ?? item.u._id)} />
								</View>
							</MessageLeftContainer>
							<MessageContainer>
								<MessageHeader>
									<MessageName>{item.u.name || item.u.username}</MessageName>
									{item.u.name && item.u.username && <MessageUsername>@{item.u.username}</MessageUsername>}
									<MessageTimestamp>{time(item.ts)}</MessageTimestamp>
								</MessageHeader>
								{item.md ? (
									<View style={{ paddingVertical: 2 }}>
										<Markup md={item.md} msg={item.msg} mentions={item.mentions} channels={item.channels} />
									</View>
								) : (
									<MessageBody>{item.msg}</MessageBody>
								)}
							</MessageContainer>
						</Message>
					)}
				/>
				<View style={{ padding: 12, gap: 8, flexDirection: 'row', alignItems: 'center' }}>
					<View style={{ flex: 1 }}>
						<View style={{ borderWidth: 1, borderColor: '#9ea2a8', borderRadius: 4, paddingHorizontal: 8, paddingVertical: 6 }}>
							<TextInput value={draft} onChange={(value: unknown) => setDraft(String(value))} placeholder='Message' />
						</View>
					</View>
					<Fit>
						<Button variant='primary' onPress={send}>
							Send
						</Button>
					</Fit>
				</View>
			</View>
		</KeyboardAvoidingView>
		</EmojiServerContext.Provider>
	);
}
