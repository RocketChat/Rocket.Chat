import type { ReactNode } from 'react';
import { FlatList, Text as RNText, View } from 'react-native';
import {
	Avatar,
	Button,
	SidebarItem,
	SidebarItemAvatarWrapper,
	SidebarItemBadge,
	SidebarItemContent,
	SidebarItemIcon,
	SidebarItemTitle,
	Tag,
} from '@rocket.chat/fuselage';

import { roomAvatarUrl, type RoomItem } from '../api';
import type { Session } from '../session';
import { useRooms } from '../useRooms';

type Props = { session: Session; onOpen: (room: RoomItem) => void; onLogout: () => void };

const roomIcon = { c: 'hash', p: 'hashtag-lock', d: 'at', l: 'headset' } as const;

// A Fuselage Button takes the width of its row on native, so it is wrapped in a fixed width
const Fit = ({ children }: { children: ReactNode }) => <View style={{ width: 96 }}>{children}</View>;

export function FuselageRooms({ session, onOpen, onLogout }: Props) {
	const { rooms, error } = useRooms(session);

	return (
		<View style={{ flex: 1, paddingTop: 64 }}>
			<View style={{ padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
				<RNText style={{ fontSize: 20, fontWeight: '700' }}>Rooms</RNText>
				<Fit>
					<Button onPress={onLogout}>Sign out</Button>
				</Fit>
			</View>
			{error && <RNText style={{ color: 'crimson', padding: 12 }}>{error}</RNText>}
			{!rooms && !error && <RNText style={{ padding: 12 }}>Loading...</RNText>}
			<FlatList
				data={rooms}
				keyExtractor={(r) => r.rid}
				renderItem={({ item }) => (
					<SidebarItem highlighted={item.unread > 0} onPress={() => onOpen(item)}>
						<SidebarItemAvatarWrapper>
							<Avatar size='x36' url={roomAvatarUrl(session, item)} />
						</SidebarItemAvatarWrapper>
						<SidebarItemIcon icon={roomIcon[item.t]} highlighted={item.unread > 0} />
						<SidebarItemContent>
							<SidebarItemTitle>{item.title}</SidebarItemTitle>
						</SidebarItemContent>
						{item.t === 'p' && <Tag>private</Tag>}
						{item.unread > 0 && <SidebarItemBadge variant='primary'>{item.unread}</SidebarItemBadge>}
					</SidebarItem>
				)}
			/>
		</View>
	);
}
