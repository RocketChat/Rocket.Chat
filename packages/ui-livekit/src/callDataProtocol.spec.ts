import type { ActiveReaction } from '@rocket.chat/ui-conference';

import {
	REACTION_TTL_MS,
	applyHand,
	createReaction,
	dropHand,
	encodeMessage,
	isHandNews,
	orderRaisedHands,
	parseMessage,
	sweepReactions,
} from './callDataProtocol';

const raw = (text: string) => new TextEncoder().encode(text);

describe('parseMessage', () => {
	it('reads back what encodeMessage wrote', () => {
		expect(parseMessage(encodeMessage({ type: 'hand', raised: true, raisedAt: 5 }))).toEqual({
			type: 'hand',
			raised: true,
			raisedAt: 5,
			rebroadcast: false,
		});
		expect(parseMessage(encodeMessage({ type: 'reaction', emoji: '🎉', reactionId: 'r1' }))).toEqual({
			type: 'reaction',
			emoji: '🎉',
			reactionId: 'r1',
		});
		expect(parseMessage(encodeMessage({ type: 'mute', target: 'ada' }))).toEqual({ type: 'mute', target: 'ada' });
	});

	// Other clients, older or newer, share the channel: whatever this one cannot act on is dropped, not thrown on.
	it('drops anything it does not understand', () => {
		expect(parseMessage(raw('not json'))).toBeNull();
		expect(parseMessage(raw('null'))).toBeNull();
		expect(parseMessage(raw('{"type":"poll"}'))).toBeNull();
		expect(parseMessage(raw('{"type":"reaction"}'))).toBeNull();
	});

	it('reads a hand without `raised` as a hand going down', () => {
		expect(parseMessage(raw('{"type":"hand"}'))).toMatchObject({ raised: false });
	});
});

describe('isHandNews', () => {
	it('announces a hand only on the way up, first time, and not when it is only being repeated', () => {
		expect(isHandNews({ type: 'hand', raised: true }, false)).toBe(true);
		expect(isHandNews({ type: 'hand', raised: true }, true)).toBe(false);
		expect(isHandNews({ type: 'hand', raised: true, rebroadcast: true }, false)).toBe(false);
		expect(isHandNews({ type: 'hand', raised: false }, false)).toBe(false);
	});
});

describe('hands', () => {
	it('records a raise at the time the raiser gave, or now where they gave none, and a lowering as 0', () => {
		expect(applyHand({}, 'ada', { type: 'hand', raised: true, raisedAt: 5 }, 99)).toEqual({ ada: 5 });
		expect(applyHand({}, 'ada', { type: 'hand', raised: true }, 99)).toEqual({ ada: 99 });
		expect(applyHand({ ada: 5 }, 'ada', { type: 'hand', raised: false }, 99)).toEqual({ ada: 0 });
	});

	it('queues raised hands oldest first and leaves out lowered ones', () => {
		expect(orderRaisedHands({ bob: 20, ada: 10, carol: 0 })).toEqual([
			{ id: 'ada', raisedAt: 10 },
			{ id: 'bob', raisedAt: 20 },
		]);
	});

	it('drops someone who left, and keeps the same map when they were never in it', () => {
		const hands = { ada: 10 };
		expect(dropHand({ ada: 10, bob: 20 }, 'bob')).toEqual({ ada: 10 });
		expect(dropHand(hands, 'bob')).toBe(hands);
	});
});

describe('reactions', () => {
	it('keeps a reaction on screen for its time to live', () => {
		expect(createReaction('ada', '👍', 1000, 'r1')).toEqual({
			id: 'r1',
			participantId: 'ada',
			emoji: '👍',
			sentAt: 1000,
			expiresAt: 1000 + REACTION_TTL_MS,
		});
		expect(createReaction('ada', '👍', 1000).id).toMatch(/^ada-1000-/);
	});

	it('sweeps out expired reactions, and returns the same array when there were none', () => {
		const live: ActiveReaction = createReaction('ada', '👍', 1000, 'live');
		const old: ActiveReaction = createReaction('bob', '👍', 0, 'old');
		expect(sweepReactions([old, live], REACTION_TTL_MS + 1)).toEqual([live]);

		const reactions = [live];
		expect(sweepReactions(reactions, 1000)).toBe(reactions);
	});
});
