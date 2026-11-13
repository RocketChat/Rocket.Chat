import {
	Avatar,
	Message,
	MessageBody,
	MessageContainer,
	MessageHeader,
	MessageLeftContainer,
	MessageName,
	MessageTimestamp,
	MessageUsername,
} from '@rocket.chat/fuselage';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import '@rocket.chat/fuselage/dist/fuselage.css';

const messages = [
	{ id: '1', name: 'Ada Lovelace', username: 'ada', time: '10:24', body: 'Has anyone tried the Tamagui frames on Expo?' },
	{ id: '2', name: 'Grace Hopper', username: 'grace', time: '10:26', body: 'Rendering them on web now, iOS is the open question.' },
	{ id: '3', name: 'Alan Turing', username: 'alan', time: '10:31', body: 'Dark mode toggle works too.' },
];

export default function App() {
	const [scheme, setScheme] = useState<'light' | 'dark'>('light');
	const next = scheme === 'light' ? 'dark' : 'light';

	return (
		<View style={{ flex: 1, paddingTop: 48, backgroundColor: scheme === 'light' ? '#ffffff' : '#111111' }}>
			<Pressable onPress={() => setScheme(next)}>
				<Text style={{ color: scheme === 'light' ? '#111111' : '#ffffff', padding: 16 }}>Switch to {next}</Text>
			</Pressable>
			<ScrollView>
				{messages.map((m) => (
					<Message key={m.id}>
						<MessageLeftContainer>
							<Avatar size='x36' alt={m.name} url={`https://open.rocket.chat/avatar/${m.username}`} />
						</MessageLeftContainer>
						<MessageContainer>
							<MessageHeader>
								<MessageName>{m.name}</MessageName>
								<MessageUsername>@{m.username}</MessageUsername>
								<MessageTimestamp>{m.time}</MessageTimestamp>
							</MessageHeader>
							<MessageBody>{m.body}</MessageBody>
						</MessageContainer>
					</Message>
				))}
			</ScrollView>
		</View>
	);
}
