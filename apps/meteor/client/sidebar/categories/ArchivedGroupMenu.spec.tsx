import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import ArchivedGroupMenu from './ArchivedGroupMenu';

const saveNotification = jest.fn(async () => ({ success: true }));

const appRoot = mockAppRoot()
	.withEndpoint('POST', '/v1/rooms.saveNotification', saveNotification as any)
	.withTranslations('en', 'core', {
		Options: 'Options',
		Mute: 'Mute',
		Unmute: 'Unmute',
		Cancel: 'Cancel',
		Mute_archived_rooms: 'Mute archived rooms',
		Unmute_archived_rooms: 'Unmute archived rooms',
		Archived_rooms_muted_description_one: '{{count}} archived room stops sending notifications and counting as unread until unmuted.',
		Archived_rooms_muted_description_other: '{{count}} archived rooms stop sending notifications and counting as unread until unmuted.',
		Archived_rooms_unmuted_description_other: '{{count}} archived rooms send notifications and count as unread again.',
		Rooms_muted_other: '{{count}} rooms muted',
		Rooms_unmuted_other: '{{count}} rooms unmuted',
	})
	.build();

const room = (overrides: Partial<SubscriptionWithRoom> & { rid: string }) =>
	({ t: 'c', name: overrides.rid, ...overrides }) as SubscriptionWithRoom;

const loud = room({ rid: 'loud' });
const halfMuted = room({ rid: 'half-muted', disableNotifications: true });
const quiet = room({ rid: 'quiet', disableNotifications: true, hideUnreadStatus: true });

beforeEach(() => {
	saveNotification.mockClear();
});

const openMenu = async (rooms: SubscriptionWithRoom[]) => {
	render(<ArchivedGroupMenu rooms={rooms} />, { wrapper: appRoot });
	await userEvent.click(screen.getByRole('button', { name: 'Options' }));
};

it('mutes the rooms not yet fully muted, after saying how many', async () => {
	await openMenu([loud, halfMuted, quiet]);
	await userEvent.click(await screen.findByRole('menuitem', { name: 'Mute archived rooms' }));

	expect(await screen.findByRole('dialog', { name: 'Mute archived rooms' })).toHaveTextContent(
		'2 archived rooms stop sending notifications and counting as unread until unmuted.',
	);
	expect(saveNotification).not.toHaveBeenCalled();

	await userEvent.click(screen.getByRole('button', { name: 'Mute' }));

	await waitFor(() => expect(saveNotification).toHaveBeenCalledTimes(2));
	expect(saveNotification).toHaveBeenCalledWith({ roomId: 'loud', notifications: { disableNotifications: '1', hideUnreadStatus: '1' } });
	expect(saveNotification).toHaveBeenCalledWith({
		roomId: 'half-muted',
		notifications: { disableNotifications: '1', hideUnreadStatus: '1' },
	});
});

it('offers to unmute once every room is muted', async () => {
	await openMenu([quiet, room({ rid: 'quiet-too', disableNotifications: true, hideUnreadStatus: true })]);

	expect(screen.queryByRole('menuitem', { name: 'Mute archived rooms' })).not.toBeInTheDocument();
	await userEvent.click(await screen.findByRole('menuitem', { name: 'Unmute archived rooms' }));
	expect(await screen.findByRole('dialog', { name: 'Unmute archived rooms' })).toHaveTextContent('2 archived rooms send notifications');

	await userEvent.click(screen.getByRole('button', { name: 'Unmute' }));

	await waitFor(() => expect(saveNotification).toHaveBeenCalledTimes(2));
	expect(saveNotification).toHaveBeenCalledWith({ roomId: 'quiet', notifications: { disableNotifications: '0', hideUnreadStatus: '0' } });
});

it('is disabled while nothing is archived', async () => {
	await openMenu([]);

	expect(await screen.findByRole('menuitem', { name: 'Mute archived rooms' })).toHaveAttribute('aria-disabled', 'true');
});
