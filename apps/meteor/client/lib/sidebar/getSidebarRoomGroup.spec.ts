import { createFakeRoom } from '../../../tests/mocks/data';

import { getSidebarRoomGroup } from './getSidebarRoomGroup';

it('returns the explicit room category before any type-derived fallback', () => {
	const room = createFakeRoom({ t: 'd', category: 'Support' });

	expect(
		getSidebarRoomGroup(room, {
			sidebarGroupByType: true,
			isDiscussionEnabled: true,
		}),
	).toBe('Support');
});

it('falls back to the existing channel grouping when no category is present', () => {
	const room = createFakeRoom({ t: 'c' });

	expect(
		getSidebarRoomGroup(room, {
			sidebarGroupByType: true,
			isDiscussionEnabled: true,
		}),
	).toBe('Channels');
});

it('keeps conversations grouped together when grouping is disabled', () => {
	const room = createFakeRoom({ t: 'p', category: 'Ignored While Disabled' });

	expect(
		getSidebarRoomGroup(room, {
			sidebarGroupByType: false,
			isDiscussionEnabled: true,
		}),
	).toBe('Ignored While Disabled');
});