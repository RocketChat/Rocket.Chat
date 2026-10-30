import { Settings } from '@rocket.chat/core-services';
import { Messages, Rooms, Subscriptions } from '@rocket.chat/models';

import { canMemberReceiveMessage, canReceiveMessage, trackHistoryCutoff, updateHistoryCutoff } from './historyVisibility';
import type { IPublication } from './types';

jest.mock('@rocket.chat/core-services', () => ({
	Settings: { get: jest.fn() },
}));

jest.mock('@rocket.chat/models', () => ({
	Subscriptions: { findOneByRoomIdAndUserId: jest.fn() },
	Messages: { findOneById: jest.fn() },
	Rooms: { findOneById: jest.fn() },
}));

const rid = 'room';
const uid = 'member';
const cutoff = new Date('2026-10-01T00:00:00Z');
const before = new Date('2026-09-01T00:00:00Z');
const after = new Date('2026-10-15T00:00:00Z');

const createPublication = (): IPublication & { stop: () => void } => {
	const onStop: (() => void)[] = [];
	return {
		userId: uid,
		onStop: (fn: () => void) => onStop.push(fn),
		stop: () => onStop.forEach((fn) => fn()),
	} as unknown as IPublication & { stop: () => void };
};

const subscribe = async (historyVisibleFrom?: Date) => {
	jest.mocked(Subscriptions.findOneByRoomIdAndUserId).mockResolvedValueOnce(historyVisibleFrom ? ({ historyVisibleFrom } as any) : null);
	const publication = createPublication();
	await trackHistoryCutoff(publication, rid, uid);
	return publication;
};

describe('historyVisibility', () => {
	beforeEach(() => {
		jest.mocked(Settings.get).mockResolvedValue(true);
		jest.mocked(Messages.findOneById).mockReset();
		jest.mocked(Rooms.findOneById).mockReset();
	});

	describe('canReceiveMessage', () => {
		it('delivers everything to members without a cutoff', async () => {
			const publication = await subscribe();

			await expect(canReceiveMessage(publication, rid, { ts: before } as any)).resolves.toBe(true);
		});

		it('drops messages sent before the cutoff', async () => {
			const publication = await subscribe(cutoff);

			await expect(canReceiveMessage(publication, rid, { ts: before } as any)).resolves.toBe(false);
			await expect(canReceiveMessage(publication, rid, { ts: after } as any)).resolves.toBe(true);
		});

		it('delivers everything while the feature is off', async () => {
			const publication = await subscribe(cutoff);
			jest.mocked(Settings.get).mockResolvedValue(false);

			await expect(canReceiveMessage(publication, rid, { ts: before } as any)).resolves.toBe(true);
		});

		it('delivers old thread roots the member follows', async () => {
			const publication = await subscribe(cutoff);

			await expect(canReceiveMessage(publication, rid, { ts: before, replies: [uid] } as any)).resolves.toBe(true);
		});

		it('drops new replies to a thread started before the cutoff', async () => {
			const publication = await subscribe(cutoff);
			jest.mocked(Messages.findOneById).mockResolvedValue({ ts: before, replies: ['someone-else'] } as any);

			await expect(canReceiveMessage(publication, rid, { ts: after, tmid: 'thread' } as any)).resolves.toBe(false);
		});

		it('delivers new replies to an old thread when they are also sent to the channel', async () => {
			const publication = await subscribe(cutoff);

			await expect(canReceiveMessage(publication, rid, { ts: after, tmid: 'thread', tshow: true } as any)).resolves.toBe(true);
			expect(Messages.findOneById).not.toHaveBeenCalled();
		});

		it('follows cutoff changes on streams already open', async () => {
			const publication = await subscribe();

			updateHistoryCutoff({ rid, u: { _id: uid } as any, historyVisibleFrom: cutoff });
			await expect(canReceiveMessage(publication, rid, { ts: before } as any)).resolves.toBe(false);

			updateHistoryCutoff({ rid, u: { _id: uid } as any });
			await expect(canReceiveMessage(publication, rid, { ts: before } as any)).resolves.toBe(true);
		});

		describe('in a discussion read through its parent room', () => {
			const discussion = 'discussion';
			const parent = 'parent';

			const subscribeThroughParent = async () => {
				jest
					.mocked(Subscriptions.findOneByRoomIdAndUserId)
					.mockResolvedValueOnce(null)
					.mockResolvedValueOnce({ rid: parent, historyVisibleFrom: cutoff } as any);
				jest.mocked(Rooms.findOneById).mockResolvedValueOnce({ prid: parent } as any);
				const publication = createPublication();
				await trackHistoryCutoff(publication, discussion, uid);
				return publication;
			};

			it('applies the member cutoff in the parent room', async () => {
				const publication = await subscribeThroughParent();

				await expect(canReceiveMessage(publication, discussion, { ts: before } as any)).resolves.toBe(false);
				await expect(canReceiveMessage(publication, discussion, { ts: after } as any)).resolves.toBe(true);
			});

			it('follows cutoff changes in the parent room', async () => {
				const publication = await subscribeThroughParent();

				updateHistoryCutoff({ rid: parent, u: { _id: uid } as any });
				await expect(canReceiveMessage(publication, discussion, { ts: before } as any)).resolves.toBe(true);
			});
		});

		it('stops tracking a stream once it closes', async () => {
			const publication = await subscribe();
			publication.stop();

			updateHistoryCutoff({ rid, u: { _id: uid } as any, historyVisibleFrom: cutoff });
			await expect(canReceiveMessage(publication, rid, { ts: before } as any)).resolves.toBe(true);
		});
	});

	describe('canMemberReceiveMessage', () => {
		it('reads the cutoff from the member subscription', async () => {
			jest.mocked(Subscriptions.findOneByRoomIdAndUserId).mockResolvedValue({ historyVisibleFrom: cutoff } as any);

			await expect(canMemberReceiveMessage(rid, uid, { ts: before } as any)).resolves.toBe(false);
			await expect(canMemberReceiveMessage(rid, uid, { ts: after } as any)).resolves.toBe(true);
		});
	});
});
