import { mockModel } from '@rocket.chat/models/testing';

import { MAX_BOTS_RESERVED_AT_ONCE, reserveAgentBots } from './identity';

const insertReservedAgentBot = jest.fn();
const findOneByUsernameIgnoringCase = jest.fn();

describe('reserveAgentBots', () => {
	beforeAll(() => {
		mockModel('Users', { insertReservedAgentBot, findOneByUsernameIgnoringCase });
	});

	beforeEach(() => {
		let next = 0;
		insertReservedAgentBot.mockReset().mockImplementation(async () => ({ insertedId: `bot-${++next}` }));
		findOneByUsernameIgnoringCase.mockReset().mockResolvedValue(null);
	});

	it('creates the requested number of bots for the engine, each with its own username', async () => {
		const now = new Date('2026-11-20T00:00:00Z');

		const bots = await reserveAgentBots('engine-1', 3, now);

		expect(bots.map(({ _id }) => _id)).toEqual(['bot-1', 'bot-2', 'bot-3']);
		expect(new Set(bots.map(({ username }) => username)).size).toBe(3);
		for (const [{ username }, [inserted]] of bots.map((bot, i) => [bot, insertReservedAgentBot.mock.calls[i]] as const)) {
			expect(username).toMatch(/^ai-agent-[0-9a-z]{10}$/);
			expect(inserted).toEqual({ username, name: username, engineId: 'engine-1', createdAt: now });
		}
	});

	it.each([0, -1, 1.5, MAX_BOTS_RESERVED_AT_ONCE + 1])('refuses to reserve %p bots', async (count) => {
		await expect(reserveAgentBots('engine-1', count)).rejects.toThrow('error-invalid-reserved-bot-count');
		expect(insertReservedAgentBot).not.toHaveBeenCalled();
	});

	it('skips a username another user already has', async () => {
		findOneByUsernameIgnoringCase.mockResolvedValueOnce({ _id: 'someone' });

		const [bot] = await reserveAgentBots('engine-1', 1);

		const [taken] = findOneByUsernameIgnoringCase.mock.calls[0];
		expect(bot.username).not.toBe(taken);
		expect(insertReservedAgentBot).toHaveBeenCalledTimes(1);
	});

	it('gives up rather than reuse a taken username', async () => {
		findOneByUsernameIgnoringCase.mockResolvedValue({ _id: 'someone' });

		await expect(reserveAgentBots('engine-1', 1)).rejects.toThrow('error-reserved-bot-username-unavailable');
		expect(insertReservedAgentBot).not.toHaveBeenCalled();
	});
});
