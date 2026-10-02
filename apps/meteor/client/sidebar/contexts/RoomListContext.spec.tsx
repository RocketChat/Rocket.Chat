import { render } from '@testing-library/react';
import { memo } from 'react';

import { RoomListContextProvider, defaultRoomListSettings, useRoomListGroups, useRoomListViewer } from './RoomListContext';
import type { SidebarRoomListGroup } from '../lib/sidebarGroups';

const group = (key: string): SidebarRoomListGroup =>
	({
		key,
		title: key,
		translateTitle: false,
		showUnreads: false,
		keepUnreadsOnTop: false,
		collapsed: false,
		rooms: [],
		unreadInfo: { userMentions: 0, groupMentions: 0, tunread: [], tunreadUser: [], unread: 0 },
		empty: true,
	}) as SidebarRoomListGroup;

const counts = { viewer: 0, groups: 0 };

const ViewerProbe = memo(() => {
	counts.viewer += 1;
	useRoomListViewer();
	return null;
});

const GroupsProbe = memo(() => {
	counts.groups += 1;
	useRoomListGroups();
	return null;
});

const Probes = () => (
	<>
		<ViewerProbe />
		<GroupsProbe />
	</>
);

describe('RoomListContext', () => {
	beforeEach(() => {
		counts.viewer = 0;
		counts.groups = 0;
	});

	it('redraws only what the groups concern when a message lands', () => {
		const settings = { ...defaultRoomListSettings };

		const { rerender } = render(
			<RoomListContextProvider settings={settings} groups={[group('Channels')]}>
				<Probes />
			</RoomListContextProvider>,
		);

		expect(counts).toEqual({ viewer: 1, groups: 1 });

		// The same settings, a new group list — which is every subscription change.
		rerender(
			<RoomListContextProvider settings={settings} groups={[group('Channels'), group('Direct_Messages')]}>
				<Probes />
			</RoomListContextProvider>,
		);

		expect(counts.groups).toBe(2);
		expect(counts.viewer).toBe(1);
	});

	it('redraws what the settings concern when the reader changes something', () => {
		const groups = [group('Channels')];

		const { rerender } = render(
			<RoomListContextProvider settings={{ ...defaultRoomListSettings }} groups={groups}>
				<Probes />
			</RoomListContextProvider>,
		);

		rerender(
			<RoomListContextProvider
				settings={{ ...defaultRoomListSettings, viewer: { ...defaultRoomListSettings.viewer, openedRoom: 'rid' } }}
				groups={groups}
			>
				<Probes />
			</RoomListContextProvider>,
		);

		expect(counts.viewer).toBe(2);
		expect(counts.groups).toBe(1);
	});
});
