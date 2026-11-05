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
		Notifications: 'Notifications',
		Turn_OFF: 'Turn off',
		Turn_ON: 'Turn on',
		Cancel: 'Cancel',
		Turn_off_notifications: 'Turn off notifications',
		Turn_on_notifications: 'Turn on notifications',
		Archived_rooms_notifications_off_description_other: '{{count}} archived rooms stop sending notifications.',
		Archived_rooms_notifications_on_description_other: '{{count}} archived rooms send notifications again.',
		Rooms_notifications_off_other: '{{count}} rooms notifications off',
		Rooms_notifications_on_other: '{{count}} rooms notifications on',
	})
	.build();

const room = (overrides: Partial<SubscriptionWithRoom> & { rid: string }) =>
	({ t: 'c', name: overrides.rid, ...overrides }) as SubscriptionWithRoom;

const loud = room({ rid: 'loud' });
const loudToo = room({ rid: 'loud-too' });
const quiet = room({ rid: 'quiet', disableNotifications: true });

beforeEach(() => {
	saveNotification.mockClear();
});

const openMenu = async (rooms: SubscriptionWithRoom[]) => {
	render(<ArchivedGroupMenu rooms={rooms} />, { wrapper: appRoot });
	await userEvent.click(screen.getByRole('button', { name: 'Options' }));
};

const notificationsItem = () => screen.findByRole('menuitem', { name: /Notifications/ });

it('is on while a room still sends notifications, and turns them off for those, after saying how many', async () => {
	await openMenu([loud, loudToo, quiet]);
	const item = await notificationsItem();
	expect(item.querySelector('input[type="checkbox"]')).toBeChecked();
	await userEvent.click(item);

	expect(await screen.findByRole('dialog', { name: 'Turn off notifications' })).toHaveTextContent(
		'2 archived rooms stop sending notifications.',
	);
	expect(saveNotification).not.toHaveBeenCalled();

	await userEvent.click(screen.getByRole('button', { name: 'Turn off' }));

	await waitFor(() => expect(saveNotification).toHaveBeenCalledTimes(2));
	expect(saveNotification).toHaveBeenCalledWith({ roomId: 'loud', notifications: { disableNotifications: '1' } });
	expect(saveNotification).toHaveBeenCalledWith({ roomId: 'loud-too', notifications: { disableNotifications: '1' } });
});

it('is off once every room has notifications off, and turns them all on', async () => {
	await openMenu([quiet, room({ rid: 'quiet-too', disableNotifications: true })]);

	const item = await notificationsItem();
	expect(item.querySelector('input[type="checkbox"]')).not.toBeChecked();
	await userEvent.click(item);
	expect(await screen.findByRole('dialog', { name: 'Turn on notifications' })).toHaveTextContent(
		'2 archived rooms send notifications again.',
	);

	await userEvent.click(screen.getByRole('button', { name: 'Turn on' }));

	await waitFor(() => expect(saveNotification).toHaveBeenCalledTimes(2));
	expect(saveNotification).toHaveBeenCalledWith({ roomId: 'quiet', notifications: { disableNotifications: '0' } });
});

it('is disabled while nothing is archived', async () => {
	await openMenu([]);

	expect(await notificationsItem()).toHaveAttribute('aria-disabled', 'true');
});
