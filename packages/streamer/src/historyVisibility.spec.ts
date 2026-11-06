import { Settings } from '@rocket.chat/core-services';
import { Messages, Subscriptions } from '@rocket.chat/models';

import {
	canMemberReceiveMessage,
	canReceiveMessage,
	trackHistoryCutoff,
	trackRoomListCutoffs,
	updateHistoryCutoff,
	visibleRoom,
} from './historyVisibility';
import type { IPublication } from './types';

jest.mock('@rocket.chat/core-services', () => ({
	Settings: { get: jest.fn() },
}));

jest.mock('@rocket.chat/models', () => ({
	Subscriptions: { findOneByRoomIdAndUserId: jest.fn(), findWithHistoryVisibleFromByUserId: jest.fn() },
	Messages: { findOneById: jest.fn() },
}));

const rid = 'room';
const uid = 'member';
const cutoff = new Date('2026-10-01T00:00:00Z');
const before = new Date('2026-09-01T00:00:00Z');
const after = new Date('2026-10-15T00:00:00Z');

const findSubscription = jest.mocked(Subscriptions.findOneByRoomIdAndUserId);
const findRestrictedSubscriptions = jest.mocked(Subscriptions.findWithHistoryVisibleFromByUserId);

const createPublication = (): IPublication & { stop: () => void } => {
	const onStop: (() => void)[] = [];
	return {
		userId: uid,
		onStop: (fn: () => void) => onStop.push(fn),
		stop: () => onStop.forEach((fn) => fn()),
	} as unknown as IPublication & { stop: () => void };
};

const subscription = (historyVisibleFrom?: Date) => (historyVisibleFrom ? { historyVisibleFrom } : {}) as any;

const subscribe = (historyVisibleFrom?: Date) => {
	findSubscription.mockResolvedValueOnce(subscription(historyVisibleFrom));
	const publication = createPublication();
	trackHistoryCutoff(publication, { _id: rid }, uid);
	return publication;
};

describe('historyVisibility', () => {
	beforeEach(() => {
		jest.mocked(Settings.get).mockReset().mockResolvedValue(true);
		jest.mocked(Messages.findOneById).mockReset();
		findSubscription.mockReset();
		findRestrictedSubscriptions.mockReset();
	});

	describe('canReceiveMessage', () => {
		it('delivers everything to members without a cutoff', async () => {
			const publication = subscribe();

			await expect(canReceiveMessage(publication, rid, { ts: before } as any)).resolves.toBe(true);
		});

		it('drops messages sent before the cutoff', async () => {
			const publication = subscribe(cutoff);

			await expect(canReceiveMessage(publication, rid, { ts: before } as any)).resolves.toBe(false);
			await expect(canReceiveMessage(publication, rid, { ts: after } as any)).resolves.toBe(true);
		});

		it('delivers everything while the feature is off, without reading the cutoff', async () => {
			const publication = subscribe(cutoff);
			jest.mocked(Settings.get).mockResolvedValue(false);

			await expect(canReceiveMessage(publication, rid, { ts: before } as any)).resolves.toBe(true);
			expect(findSubscription).not.toHaveBeenCalled();
		});

		it('reads the cutoff on the first event that needs it, and only then', async () => {
			const publication = subscribe(cutoff);
			expect(findSubscription).not.toHaveBeenCalled();

			await canReceiveMessage(publication, rid, { ts: before } as any);
			await canReceiveMessage(publication, rid, { ts: after } as any);

			expect(findSubscription).toHaveBeenCalledTimes(1);
		});

		it('reads the feature setting once per event, however many subscribers it reaches', async () => {
			const publications = [subscribe(cutoff), subscribe(cutoff)];
			const message = { ts: before } as any;

			await Promise.all(publications.map((publication) => canReceiveMessage(publication, rid, message)));

			expect(Settings.get).toHaveBeenCalledTimes(1);
		});

		it('delivers old thread roots the member follows', async () => {
			const publication = subscribe(cutoff);

			await expect(canReceiveMessage(publication, rid, { ts: before, replies: [uid] } as any)).resolves.toBe(true);
		});

		it('drops new replies to a thread started before the cutoff', async () => {
			const publication = subscribe(cutoff);
			jest.mocked(Messages.findOneById).mockResolvedValue({ ts: before, replies: ['someone-else'] } as any);

			await expect(canReceiveMessage(publication, rid, { ts: after, tmid: 'thread' } as any)).resolves.toBe(false);
		});

		it('delivers new replies to an old thread when they are also sent to the channel', async () => {
			const publication = subscribe(cutoff);

			await expect(canReceiveMessage(publication, rid, { ts: after, tmid: 'thread', tshow: true } as any)).resolves.toBe(true);
			expect(Messages.findOneById).not.toHaveBeenCalled();
		});

		it('follows cutoff changes on streams already open', async () => {
			const publication = subscribe();

			updateHistoryCutoff({ rid, u: { _id: uid } as any, historyVisibleFrom: cutoff });
			await expect(canReceiveMessage(publication, rid, { ts: before } as any)).resolves.toBe(false);

			updateHistoryCutoff({ rid, u: { _id: uid } as any });
			await expect(canReceiveMessage(publication, rid, { ts: before } as any)).resolves.toBe(true);
		});

		it('keeps a cutoff change that arrives while the first read is in flight', async () => {
			let resolveRead: (value: unknown) => void = () => undefined;
			findSubscription.mockReturnValueOnce(
				new Promise((resolve) => {
					resolveRead = resolve;
				}) as any,
			);
			const publication = createPublication();
			trackHistoryCutoff(publication, { _id: rid }, uid);

			const inFlight = canReceiveMessage(publication, rid, { ts: before } as any);
			await new Promise(setImmediate);
			expect(findSubscription).toHaveBeenCalledTimes(1);

			updateHistoryCutoff({ rid, u: { _id: uid } as any });
			resolveRead(subscription(cutoff));
			await inFlight;

			await expect(canReceiveMessage(publication, rid, { ts: before } as any)).resolves.toBe(true);
		});

		describe('in a discussion read through its parent room', () => {
			const discussion = { _id: 'discussion', prid: 'parent' };

			const subscribeThroughParent = () => {
				findSubscription.mockResolvedValueOnce(null).mockResolvedValueOnce(subscription(cutoff));
				const publication = createPublication();
				trackHistoryCutoff(publication, discussion, uid);
				return publication;
			};

			it('applies the member cutoff in the parent room', async () => {
				const publication = subscribeThroughParent();

				await expect(canReceiveMessage(publication, discussion._id, { ts: before } as any)).resolves.toBe(false);
				await expect(canReceiveMessage(publication, discussion._id, { ts: after } as any)).resolves.toBe(true);
				expect(findSubscription).toHaveBeenLastCalledWith(discussion.prid, uid, expect.anything());
			});

			it('follows cutoff changes in the parent room', async () => {
				const publication = subscribeThroughParent();
				await canReceiveMessage(publication, discussion._id, { ts: before } as any);

				updateHistoryCutoff({ rid: discussion.prid, u: { _id: uid } as any });
				await expect(canReceiveMessage(publication, discussion._id, { ts: before } as any)).resolves.toBe(true);
			});

			it('switches to the discussion cutoff once the member joins it', async () => {
				const publication = subscribeThroughParent();
				await canReceiveMessage(publication, discussion._id, { ts: before } as any);

				updateHistoryCutoff({ rid: discussion._id, u: { _id: uid } as any });
				await expect(canReceiveMessage(publication, discussion._id, { ts: before } as any)).resolves.toBe(true);

				updateHistoryCutoff({ rid: discussion.prid, u: { _id: uid } as any, historyVisibleFrom: cutoff });
				await expect(canReceiveMessage(publication, discussion._id, { ts: before } as any)).resolves.toBe(true);
			});
		});

		it('stops tracking a stream once it closes', async () => {
			const publication = subscribe();
			await canReceiveMessage(publication, rid, { ts: before } as any);
			publication.stop();

			updateHistoryCutoff({ rid, u: { _id: uid } as any, historyVisibleFrom: cutoff });
			await expect(canReceiveMessage(publication, rid, { ts: before } as any)).resolves.toBe(true);
		});
	});

	describe('canMemberReceiveMessage', () => {
		const room = { _id: rid };

		it('applies the cutoff of the subscription it is given, without reading it again', async () => {
			await expect(canMemberReceiveMessage(room, uid, { ts: before } as any, subscription(cutoff))).resolves.toBe(false);
			await expect(canMemberReceiveMessage(room, uid, { ts: after } as any, subscription(cutoff))).resolves.toBe(true);
			expect(findSubscription).not.toHaveBeenCalled();
		});

		it('applies the parent room cutoff to someone who reads a discussion without being in it', async () => {
			findSubscription.mockResolvedValueOnce(subscription(cutoff));

			await expect(canMemberReceiveMessage({ _id: 'discussion', prid: 'parent' }, uid, { ts: before } as any, null)).resolves.toBe(false);
			expect(findSubscription).toHaveBeenCalledWith('parent', uid, expect.anything());
		});

		it('reads nothing for someone outside a room that is not a discussion', async () => {
			await expect(canMemberReceiveMessage(room, uid, { ts: before } as any, null)).resolves.toBe(true);
			expect(findSubscription).not.toHaveBeenCalled();
		});
	});

	describe('visibleRoom', () => {
		const room = { _id: rid, name: 'room', lastMessage: { _id: 'last', ts: before } } as any;

		it('leaves out a last message from before the cutoff', async () => {
			const publication = subscribe(cutoff);

			await expect(visibleRoom(publication, { ...room })).resolves.toEqual({ _id: rid, name: 'room' });
		});

		it('keeps a last message sent after the cutoff', async () => {
			const publication = subscribe(cutoff);
			const recent = { ...room, lastMessage: { _id: 'last', ts: after } };

			await expect(visibleRoom(publication, recent)).resolves.toBe(recent);
		});

		it('keeps everything while the feature is off', async () => {
			const publication = subscribe(cutoff);
			jest.mocked(Settings.get).mockResolvedValue(false);
			const event = { ...room };

			await expect(visibleRoom(publication, event)).resolves.toBe(event);
		});

		describe('on a room list stream', () => {
			const subscribeToRoomList = () => {
				findRestrictedSubscriptions.mockReturnValueOnce({ toArray: async () => [{ rid, historyVisibleFrom: cutoff }] } as any);
				const publication = createPublication();
				trackRoomListCutoffs(publication, uid);
				return publication;
			};

			it('reads the cutoffs together, on the first event that needs them', async () => {
				const publication = subscribeToRoomList();
				expect(findRestrictedSubscriptions).not.toHaveBeenCalled();

				await expect(visibleRoom(publication, { ...room })).resolves.not.toHaveProperty('lastMessage');
				const other = { ...room, _id: 'other-room' };
				await expect(visibleRoom(publication, other)).resolves.toBe(other);

				expect(findRestrictedSubscriptions).toHaveBeenCalledTimes(1);
				expect(findSubscription).not.toHaveBeenCalled();
			});

			it('follows rooms restricted later', async () => {
				const publication = subscribeToRoomList();
				await visibleRoom(publication, { ...room });

				updateHistoryCutoff({ rid: 'other-room', u: { _id: uid } as any, historyVisibleFrom: cutoff });
				await expect(visibleRoom(publication, { ...room, _id: 'other-room' })).resolves.not.toHaveProperty('lastMessage');
			});
		});
	});
});
