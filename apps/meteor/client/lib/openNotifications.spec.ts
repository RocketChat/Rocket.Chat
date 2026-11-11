import { OpenNotifications, isSeenLater } from './openNotifications';

const createNotification = () => {
	const closeListeners: (() => void)[] = [];
	return {
		close: jest.fn(),
		addEventListener: (type: string, listener: () => void) => type === 'close' && closeListeners.push(listener),
		dismiss: () => closeListeners.forEach((listener) => listener()),
	};
};

const seenBefore = new Date('2026-01-01T10:00:00Z');
const seenAfter = new Date('2026-01-01T10:05:00Z');

const track = (
	openNotifications: OpenNotifications,
	rid: string,
	{ tmid, ls = seenBefore, tunread }: { tmid?: string; ls?: Date; tunread?: string[] } = {},
) => {
	const notification = createNotification();
	openNotifications.track(notification as unknown as Notification, { rid, tmid, ls, tunread });
	return notification;
};

const read = { ls: seenAfter, alert: false, unread: 0, tunread: [] };

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

	openNotifications.closeReadNotifications({ rid: 'roomA', ...read });

	expect(firstA.close).toHaveBeenCalledTimes(1);
	expect(secondA.close).toHaveBeenCalledTimes(1);
	expect(onlyB.close).not.toHaveBeenCalled();
});

it('frees the place of the notifications closed when their room is read', () => {
	const openNotifications = new OpenNotifications();
	const oldest = track(openNotifications, 'roomX');
	track(openNotifications, 'roomA');
	track(openNotifications, 'roomA');

	openNotifications.closeReadNotifications({ rid: 'roomA', ...read });
	Array.from({ length: 49 }, (_, i) => track(openNotifications, `room${i}`));

	expect(oldest.close).not.toHaveBeenCalled();
});

it('closes the notifications of a read room that still has an unread thread', () => {
	const openNotifications = new OpenNotifications();
	const notification = track(openNotifications, 'roomA', { tunread: ['threadId'] });

	openNotifications.closeReadNotifications({ rid: 'roomA', ...read, alert: true, tunread: ['threadId'] });

	expect(notification.close).toHaveBeenCalledTimes(1);
});

it.each([
	['marks the room unread', { ls: seenBefore, alert: true, unread: 1 }],
	['repeats an earlier read state', { ls: seenBefore, alert: false, unread: 0 }],
])('keeps the notifications of a room open when an update %s', (_, update) => {
	const openNotifications = new OpenNotifications();
	const notification = track(openNotifications, 'roomA');

	openNotifications.closeReadNotifications({ rid: 'roomA', tunread: [], ...update });

	expect(notification.close).not.toHaveBeenCalled();
});

it('keeps a thread notification open while its thread is unread, and closes it once the thread is read', () => {
	const openNotifications = new OpenNotifications();
	const notification = track(openNotifications, 'roomA', { tmid: 'threadId' });

	openNotifications.closeReadNotifications({ rid: 'roomA', ls: seenBefore, alert: true, unread: 0, tunread: ['threadId'] });
	openNotifications.closeReadNotifications({ rid: 'roomA', ...read, alert: true, tunread: ['threadId'] });
	expect(notification.close).not.toHaveBeenCalled();

	openNotifications.closeReadNotifications({ rid: 'roomA', ls: seenAfter, alert: false, unread: 0, tunread: [] });
	expect(notification.close).toHaveBeenCalledTimes(1);
});

it('closes a thread notification when its room is read and the thread was never reported unread', () => {
	const openNotifications = new OpenNotifications();
	const notification = track(openNotifications, 'roomA', { tmid: 'threadId' });

	openNotifications.closeReadNotifications({ rid: 'roomA', ls: seenBefore, alert: true, unread: 0, tunread: [] });
	expect(notification.close).not.toHaveBeenCalled();

	openNotifications.closeReadNotifications({ rid: 'roomA', ...read });
	expect(notification.close).toHaveBeenCalledTimes(1);
});

it.each([
	['an alert', { alert: true }],
	['unread messages', { unread: 2 }],
])('without a last-seen time, keeps the notifications of a room open while it still has %s', (_, unread) => {
	const openNotifications = new OpenNotifications();
	const notification = createNotification();
	openNotifications.track(notification as unknown as Notification, { rid: 'roomA' });

	openNotifications.closeReadNotifications({ rid: 'roomA', alert: false, unread: 0, ...unread });

	expect(notification.close).not.toHaveBeenCalled();
});

it('closes every notification of a room when the room is removed', () => {
	const openNotifications = new OpenNotifications();
	const main = track(openNotifications, 'roomA');
	const thread = track(openNotifications, 'roomA', { tmid: 'threadId', tunread: ['threadId'] });
	const other = track(openNotifications, 'roomB');

	openNotifications.closeRoomNotifications('roomA');

	expect(main.close).toHaveBeenCalledTimes(1);
	expect(thread.close).toHaveBeenCalledTimes(1);
	expect(other.close).not.toHaveBeenCalled();
});

it('closes every notification when the store is cleared', () => {
	const openNotifications = new OpenNotifications();
	const notifications = [track(openNotifications, 'roomA'), track(openNotifications, 'roomB')];

	openNotifications.closeAll();
	openNotifications.closeReadNotifications({ rid: 'roomA', ...read });

	expect(notifications.every((notification) => notification.close.mock.calls.length === 1)).toBe(true);
});

it.each([
	[seenAfter, seenBefore, true],
	[seenBefore, seenBefore, false],
	[seenBefore, seenAfter, false],
	[undefined, seenBefore, false],
	[seenAfter, undefined, true],
	[undefined, undefined, false],
])('isSeenLater(%s, %s) is %s', (lastSeen, earlierLastSeen, expected) => {
	expect(isSeenLater(lastSeen, earlierLastSeen)).toBe(expected);
});
