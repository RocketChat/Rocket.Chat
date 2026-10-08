import { latestReactionBySender } from './reactions';

const reaction = (id: string, participantId: string, emoji: string) => ({ id, participantId, emoji, sentAt: 0, expiresAt: 0 });

describe('latestReactionBySender', () => {
	it("keeps only each sender's latest reaction, in the order they arrived", () => {
		expect(
			latestReactionBySender([reaction('1', 'ada', '👍'), reaction('2', 'bob', '🎉'), reaction('3', 'ada', '❤️')]),
		).toEqual({
			ada: { id: '3', emoji: '❤️' },
			bob: { id: '2', emoji: '🎉' },
		});
	});

	it('has nothing for anyone when nobody is reacting', () => {
		expect(latestReactionBySender([])).toEqual({});
	});
});
