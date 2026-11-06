import { mockAppRoot } from '@rocket.chat/mock-providers';
import { act, renderHook } from '@testing-library/react';

import { useActivityFilterAnnouncement } from './useActivityFilterAnnouncement';
import type { SidebarRoomListGroup } from './useRoomList';

const group = (key: string, activityFilterHours: number | undefined, inactiveCount: number): SidebarRoomListGroup =>
	({ key, title: key, translateTitle: true, activityFilterHours, inactiveCount }) as unknown as SidebarRoomListGroup;

const appRoot = mockAppRoot()
	.withTranslations('en', 'core', {
		Channels: 'Channels',
		Last_7_days: 'Last 7 days',
		Last_24_hours: 'Last 24 hours',
		Inactive_rooms_hidden_in_group_one: '{{filter}}: {{count}} inactive room hidden in {{group}}',
		Inactive_rooms_hidden_in_group_other: '{{filter}}: {{count}} inactive rooms hidden in {{group}}',
		Activity_filter_cleared_in_group: 'Filter cleared in {{group}}',
	})
	.build();

const renderAnnouncement = (initialGroups: SidebarRoomListGroup[]) =>
	renderHook(({ groups }) => useActivityFilterAnnouncement(groups), { wrapper: appRoot, initialProps: { groups: initialGroups } });

describe('useActivityFilterAnnouncement', () => {
	it('says nothing until a filter is chosen', () => {
		const { result, rerender } = renderAnnouncement([group('Channels', undefined, 0)]);

		expect(result.current.announcement).toBe('');

		// The filter changing on its own (another device, the license arriving) is not announced.
		rerender({ groups: [group('Channels', 24, 2)] });
		expect(result.current.announcement).toBe('');
	});

	it('announces a chosen window once the group reflects it, with the count it hides', () => {
		const { result, rerender } = renderAnnouncement([group('Channels', 24, 2)]);

		act(() => result.current.announceActivityFilter('Channels', 168));
		expect(result.current.announcement).toBe('');

		rerender({ groups: [group('Channels', 168, 3)] });
		expect(result.current.announcement).toBe('Last 7 days: 3 inactive rooms hidden in Channels');
	});

	it('announces a cleared filter', () => {
		const { result, rerender } = renderAnnouncement([group('Channels', 24, 2)]);

		act(() => result.current.announceActivityFilter('Channels', undefined));
		rerender({ groups: [group('Channels', undefined, 0)] });

		expect(result.current.announcement).toBe('Filter cleared in Channels');
	});

	it('announces right away when the group already has the chosen window', () => {
		const { result } = renderAnnouncement([group('Channels', 24, 1)]);

		act(() => result.current.announceActivityFilter('Channels', 24));

		expect(result.current.announcement).toBe('Last 24 hours: 1 inactive room hidden in Channels');
	});

	it('announces each choice once', () => {
		const { result, rerender } = renderAnnouncement([group('Channels', 24, 2)]);

		act(() => result.current.announceActivityFilter('Channels', 168));
		rerender({ groups: [group('Channels', 168, 3)] });
		rerender({ groups: [group('Channels', 168, 5)] });

		expect(result.current.announcement).toBe('Last 7 days: 3 inactive rooms hidden in Channels');
	});
});
