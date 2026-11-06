import { OpenNotifications } from './openNotifications';

const createNotification = () => {
	const closeListeners: (() => void)[] = [];
	return {
		close: jest.fn(),
		addEventListener: (type: string, listener: () => void) => type === 'close' && closeListeners.push(listener),
		dismiss: () => closeListeners.forEach((listener) => listener()),
	};
};

const track = (openNotifications: OpenNotifications, rid: string) => {
	const notification = createNotification();
	openNotifications.track(rid, notification as unknown as Notification);
	return notification;
};

const read = { alert: false, unread: 0, tunread: [] };

it('closes the oldest notification once more than 50 are open', () => {
	const openNotifications = new OpenNotifications();

	const [oldest, ...others] = Array.from({ length: 51 }, (_, i) => track(openNotifications, `room${i}`));

	expect(oldest.close).toHaveBeenCalledTimes(1);
	expect(others.every((notification) => notification.close.mock.calls.length === 0)).toBe(true);
});

it('does not count a notification the user dismissed toward the 50', () => {
	const openNotifications = new OpenNotifications();

	const notifications = Array.from({ length: 50 }, (_, i) => track(openNotifications, `room${i}`));
	notifications[1].dismiss();
	notifications.push(track(openNotifications, 'room50'));

	expect(notifications.every((notification) => notification.close.mock.calls.length === 0)).toBe(true);
});

it('closes the notifications of a room once it is read, and only those', () => {
	const openNotifications = new OpenNotifications();
	const firstA = track(openNotifications, 'roomA');
	const secondA = track(openNotifications, 'roomA');
	const onlyB = track(openNotifications, 'roomB');

	openNotifications.closeNotificationsOfReadRoom({ rid: 'roomA', ...read });

	expect(firstA.close).toHaveBeenCalledTimes(1);
	expect(secondA.close).toHaveBeenCalledTimes(1);
	expect(onlyB.close).not.toHaveBeenCalled();
});

it('frees the place of the notifications closed when their room is read', () => {
	const openNotifications = new OpenNotifications();
	const oldest = track(openNotifications, 'roomX');
	track(openNotifications, 'roomA');
	track(openNotifications, 'roomA');

	openNotifications.closeNotificationsOfReadRoom({ rid: 'roomA', ...read });
	Array.from({ length: 49 }, (_, i) => track(openNotifications, `room${i}`));

	expect(oldest.close).not.toHaveBeenCalled();
});

it.each([
	['an alert', { alert: true }],
	['unread messages', { unread: 2 }],
	['an unread thread', { tunread: ['threadId'] }],
])('keeps the notifications of a room open while it still has %s', (_, unread) => {
	const openNotifications = new OpenNotifications();
	const notification = track(openNotifications, 'roomA');

	openNotifications.closeNotificationsOfReadRoom({ rid: 'roomA', ...read, ...unread });

	expect(notification.close).not.toHaveBeenCalled();
});
