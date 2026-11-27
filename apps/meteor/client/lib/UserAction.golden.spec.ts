import type { IUser } from '@rocket.chat/core-typings';

import { USER_ACTIVITIES, UserAction } from './UserAction';
import { Users } from '../stores';
import { behavior, clearCalls, getCalls, resetFakes, streams } from './chats/goldenFakes';

jest.mock('./SDKClient', () => jest.requireActual('./chats/goldenFakes').sdkModule);
jest.mock('./settings', () => jest.requireActual('./chats/goldenFakes').settingsModule);
jest.mock('./user', () => jest.requireActual('./chats/goldenFakes').userModule);

// UserAction keeps its maps and one shared debounce at module level, so each test uses its own room.
let counter = 0;
let rid: string;

const publishes = () => getCalls().filter(([fn]) => fn === 'sdk.publish');

const publication = (room: string, activities: string[], extras: object = {}) => [
	'sdk.publish',
	'notify-room',
	[`${room}/user-activity`, 'john.doe', activities, extras],
];

beforeEach(() => {
	jest.useFakeTimers();
	resetFakes();
	counter += 1;
	rid = `room-${counter}`;
	Users.state.store({ _id: 'uid1', username: 'john.doe', name: 'John Doe' } as IUser);
});

afterEach(() => {
	jest.advanceTimersByTime(120_000);
	jest.useRealTimers();
	clearCalls();
});

describe('UserAction golden: emitting an activity', () => {
	it('publishes the activities of the room once, 500 ms after the first start, reading the user name then the real-name setting', () => {
		UserAction.start(rid, USER_ACTIVITIES.USER_TYPING, {});

		jest.advanceTimersByTime(499);
		expect(getCalls()).toEqual([]);

		jest.advanceTimersByTime(1);
		expect(getCalls()).toEqual([['getUser'], ['settings.peek', 'UI_Use_Real_Name'], publication(rid, ['user-typing'])]);
	});

	it('publishes the real name when the setting is on', () => {
		behavior.settings.UI_Use_Real_Name = true;

		UserAction.start(rid, USER_ACTIVITIES.USER_TYPING, {});
		jest.advanceTimersByTime(500);

		expect(publishes()).toEqual([['sdk.publish', 'notify-room', [`${rid}/user-activity`, 'John Doe', ['user-typing'], {}]]]);
	});

	it('publishes an undefined name without a user', () => {
		behavior.user = undefined;

		UserAction.start(rid, USER_ACTIVITIES.USER_TYPING, {});
		jest.advanceTimersByTime(500);

		expect(publishes()).toEqual([['sdk.publish', 'notify-room', [`${rid}/user-activity`, undefined, ['user-typing'], {}]]]);
	});

	it('coalesces starts inside the debounce window into one publication with every activity', () => {
		UserAction.start(rid, USER_ACTIVITIES.USER_TYPING, {});
		jest.advanceTimersByTime(200);
		UserAction.start(rid, USER_ACTIVITIES.USER_RECORDING, {});
		jest.advanceTimersByTime(500);

		expect(publishes()).toEqual([publication(rid, ['user-typing', 'user-recording'])]);
	});

	it('restarts the debounce window on every call', () => {
		UserAction.start(rid, USER_ACTIVITIES.USER_TYPING, {});
		jest.advanceTimersByTime(400);
		UserAction.start(rid, USER_ACTIVITIES.USER_RECORDING, {});
		jest.advanceTimersByTime(400);
		expect(publishes()).toEqual([]);

		jest.advanceTimersByTime(100);
		expect(publishes()).toHaveLength(1);
	});

	it('shares one debounce across rooms: a start in another room inside the window replaces the pending publication', () => {
		const other = `${rid}-other`;

		UserAction.start(rid, USER_ACTIVITIES.USER_TYPING, {});
		UserAction.start(other, USER_ACTIVITIES.USER_TYPING, {});
		jest.advanceTimersByTime(500);

		expect(publishes()).toEqual([publication(other, ['user-typing'])]);
	});

	it('publishes a thread activity on the room channel with the thread extras, listing only that thread', () => {
		UserAction.start(rid, USER_ACTIVITIES.USER_TYPING, { tmid: 't1' });
		jest.advanceTimersByTime(500);

		expect(publishes()).toEqual([publication(rid, ['user-typing'], { tmid: 't1' })]);
	});
});

describe('UserAction golden: renew window', () => {
	it('ignores a start for the same activity during the 5 s renew window and accepts it afterwards', () => {
		UserAction.start(rid, USER_ACTIVITIES.USER_TYPING, {});
		jest.advanceTimersByTime(1000);
		UserAction.start(rid, USER_ACTIVITIES.USER_TYPING, {});
		jest.advanceTimersByTime(1000);
		expect(publishes()).toHaveLength(1);

		jest.advanceTimersByTime(3000);
		UserAction.start(rid, USER_ACTIVITIES.USER_TYPING, {});
		jest.advanceTimersByTime(500);
		expect(publishes()).toHaveLength(2);
	});

	it('keeps different activities of one room on separate renew windows', () => {
		UserAction.start(rid, USER_ACTIVITIES.USER_TYPING, {});
		jest.advanceTimersByTime(600);
		UserAction.start(rid, USER_ACTIVITIES.USER_UPLOADING, {});
		jest.advanceTimersByTime(500);

		expect(publishes().at(-1)).toEqual(publication(rid, ['user-typing', 'user-uploading']));
	});
});

describe('UserAction golden: stopping', () => {
	it('stops by itself after 15 s without a new start, publishing the room without the activity', () => {
		UserAction.start(rid, USER_ACTIVITIES.USER_TYPING, {});
		jest.advanceTimersByTime(14_999);
		expect(publishes()).toHaveLength(1);

		jest.advanceTimersByTime(1);
		jest.advanceTimersByTime(500);

		expect(publishes()).toEqual([publication(rid, ['user-typing']), publication(rid, [])]);
	});

	it('publishes the auto-stop of a thread activity on the thread channel, not the room channel', () => {
		UserAction.start(rid, USER_ACTIVITIES.USER_TYPING, { tmid: 't1' });
		jest.advanceTimersByTime(15_500);

		expect(publishes()).toEqual([publication(rid, ['user-typing'], { tmid: 't1' }), publication('t1', [], { tmid: 't1' })]);
	});

	it('an explicit stop publishes on the room channel and cancels the pending auto-stop', () => {
		UserAction.start(rid, USER_ACTIVITIES.USER_TYPING, { tmid: 't1' });
		jest.advanceTimersByTime(1000);
		UserAction.stop(rid, USER_ACTIVITIES.USER_TYPING, { tmid: 't1' });
		jest.advanceTimersByTime(60_000);

		expect(publishes()).toEqual([publication(rid, ['user-typing'], { tmid: 't1' }), publication(rid, [], { tmid: 't1' })]);
	});

	it('allows a new start right after a stop, without waiting for the renew window', () => {
		UserAction.start(rid, USER_ACTIVITIES.USER_TYPING, {});
		jest.advanceTimersByTime(600);
		UserAction.stop(rid, USER_ACTIVITIES.USER_TYPING, {});
		jest.advanceTimersByTime(600);
		UserAction.start(rid, USER_ACTIVITIES.USER_TYPING, {});
		jest.advanceTimersByTime(500);

		expect(publishes()).toEqual([publication(rid, ['user-typing']), publication(rid, []), publication(rid, ['user-typing'])]);
	});

	it('publishes an empty set when stopping something that never started', () => {
		UserAction.stop(rid, USER_ACTIVITIES.USER_PLAYING, {});
		jest.advanceTimersByTime(500);

		expect(publishes()).toEqual([publication(rid, [])]);
	});
});

describe('UserAction golden: performing continuously', () => {
	it('starts now, renews every 5 s, never times out, and stops everything on stop', () => {
		UserAction.performContinuously(rid, USER_ACTIVITIES.USER_UPLOADING, {});

		jest.advanceTimersByTime(500);
		expect(publishes()).toHaveLength(1);
		jest.advanceTimersByTime(4_999);
		expect(publishes()).toHaveLength(1);
		jest.advanceTimersByTime(1);
		jest.advanceTimersByTime(500);
		expect(publishes()).toHaveLength(2);

		jest.advanceTimersByTime(60_000);
		expect(publishes().every((call) => (call[2] as [string, string, string[]])[2].includes('user-uploading'))).toBe(true);

		UserAction.stop(rid, USER_ACTIVITIES.USER_UPLOADING, {});
		jest.advanceTimersByTime(500);
		const count = publishes().length;
		expect(publishes().at(-1)).toEqual(publication(rid, []));

		jest.advanceTimersByTime(60_000);
		expect(publishes()).toHaveLength(count);
	});

	it('a second call for the same activity does not start another interval', () => {
		UserAction.performContinuously(rid, USER_ACTIVITIES.USER_UPLOADING, {});
		UserAction.performContinuously(rid, USER_ACTIVITIES.USER_UPLOADING, {});
		jest.advanceTimersByTime(500);
		expect(publishes()).toHaveLength(1);

		jest.advanceTimersByTime(5_000);
		expect(publishes()).toHaveLength(2);
		UserAction.stop(rid, USER_ACTIVITIES.USER_UPLOADING, {});
	});
});

describe('UserAction golden: following a room', () => {
	it('subscribes to the room activity channel once and unsubscribes through the returned function', () => {
		const stop = UserAction.addStream(rid);

		expect(getCalls()).toEqual([['sdk.stream', 'notify-room', [`${rid}/user-activity`]]]);
		expect(() => UserAction.addStream(rid)).toThrow('UserAction - addStream should only be called once per room');

		stop();
		stop();
		expect(getCalls().slice(1)).toEqual([['sdk.stream.stop']]);

		const again = UserAction.addStream(rid);
		again();
	});

	it('shows another user as performing the activity and notifies subscribers', () => {
		const stop = UserAction.addStream(rid);
		const changed = jest.fn();
		const unsubscribe = UserAction.subscribe(changed);

		streams.handler?.('alice', ['user-typing'], {});

		expect(Object.keys(UserAction.get(rid)?.['user-typing'] ?? {})).toEqual(['alice']);
		expect(Object.keys(UserAction.get(rid)?.['user-recording'] ?? {})).toEqual([]);
		expect(changed).toHaveBeenCalledTimes(1);

		unsubscribe();
		streams.handler?.('bob', ['user-typing'], {});
		expect(changed).toHaveBeenCalledTimes(1);
		stop();
	});

	it('drops the user 15 s after the last announcement, and an announcement restarts that time', () => {
		const stop = UserAction.addStream(rid);

		streams.handler?.('alice', ['user-typing'], {});
		jest.advanceTimersByTime(10_000);
		streams.handler?.('alice', ['user-typing'], {});
		jest.advanceTimersByTime(14_999);
		expect(Object.keys(UserAction.get(rid)?.['user-typing'] ?? {})).toEqual(['alice']);

		jest.advanceTimersByTime(1);
		expect(Object.keys(UserAction.get(rid)?.['user-typing'] ?? {})).toEqual([]);
		stop();
	});

	it('drops the user when a later announcement no longer lists the activity', () => {
		const stop = UserAction.addStream(rid);

		streams.handler?.('alice', ['user-typing', 'user-recording'], {});
		streams.handler?.('alice', ['user-recording'], {});

		expect(Object.keys(UserAction.get(rid)?.['user-typing'] ?? {})).toEqual([]);
		expect(Object.keys(UserAction.get(rid)?.['user-recording'] ?? {})).toEqual(['alice']);
		stop();
	});

	it('empties the activity array it was given while processing it', () => {
		const stop = UserAction.addStream(rid);
		const announced = ['user-typing'];

		streams.handler?.('alice', announced, {});

		expect(announced).toEqual([]);
		stop();
	});

	it('files a thread announcement under the thread id', () => {
		const stop = UserAction.addStream(rid);

		streams.handler?.('alice', ['user-typing'], { tmid: 't1' });

		expect(UserAction.get(rid)).toBeUndefined();
		expect(Object.keys(UserAction.get('t1')?.['user-typing'] ?? {})).toEqual(['alice']);
		stop();
	});

	it('ignores announcements from the current user by username', () => {
		const stop = UserAction.addStream(rid);
		const changed = jest.fn();
		UserAction.subscribe(changed);

		streams.handler?.('john.doe', ['user-typing'], {});

		expect(UserAction.get(rid)).toBeUndefined();
		expect(changed).not.toHaveBeenCalled();
		stop();
	});

	it('ignores the current user by real name when that setting is on, and then shows the username as someone else', () => {
		behavior.settings.UI_Use_Real_Name = true;
		behavior.userId = 'uid1';
		const stop = UserAction.addStream(rid);

		streams.handler?.('John Doe', ['user-typing'], {});
		expect(UserAction.get(rid)).toBeUndefined();

		streams.handler?.('john.doe', ['user-typing'], {});
		expect(Object.keys(UserAction.get(rid)?.['user-typing'] ?? {})).toEqual(['john.doe']);
		stop();
	});

	it('shows everyone when there is no logged user', () => {
		behavior.userId = undefined;
		const stop = UserAction.addStream(rid);

		streams.handler?.('john.doe', ['user-typing'], {});

		expect(Object.keys(UserAction.get(rid)?.['user-typing'] ?? {})).toEqual(['john.doe']);
		stop();
	});
});
