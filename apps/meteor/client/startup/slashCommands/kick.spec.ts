import { createFakeMessage } from '../../../tests/mocks/data';
import { queryClient } from '../../lib/queryClient';
import { slashCommands } from '../../lib/slashCommand';

import './kick';

jest.mock('../../lib/queryClient', () => ({
	queryClient: {
		invalidateQueries: jest.fn(),
	},
}));

const invalidateQueries = jest.mocked(queryClient.invalidateQueries);

const getResultHandler = () => {
	const { result } = slashCommands.commands.kick;
	expect(result).toBeDefined();
	return result as NonNullable<typeof result>;
};

const getCallback = () => {
	const { callback } = slashCommands.commands.kick;
	expect(callback).toBeDefined();
	return callback as NonNullable<typeof callback>;
};

const runCommand = (params: string) =>
	getCallback()({
		command: 'kick',
		params,
		message: { _id: 'message-id', rid: 'room-id' },
		userId: 'user-id',
	});

describe('/kick slash command', () => {
	afterEach(() => {
		jest.clearAllMocks();
	});

	it.each([
		['an unadorned username', 'alice'],
		['surrounding whitespace', '  alice  '],
		['an @ prefix and surrounding whitespace', '  @alice  '],
	])('returns the normalized username when given %s', (_case, input) => {
		expect(runCommand(input)).toBe('alice');
	});

	it('returns nothing when the input is empty after trimming', () => {
		expect(runCommand('   ')).toBeUndefined();
	});

	it('invalidates the room-members query after success', () => {
		const result = getResultHandler();
		result(undefined, undefined, {
			cmd: 'kick',
			params: 'alice',
			msg: createFakeMessage({ rid: 'room-id' }),
		});

		expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['rooms', 'room-id', 'members'] });
	});

	it('does not invalidate the room-members query after an error', () => {
		const result = getResultHandler();
		result(new Error('Failed to kick user'), undefined, {
			cmd: 'kick',
			params: 'alice',
			msg: createFakeMessage({ rid: 'room-id' }),
		});

		expect(invalidateQueries).not.toHaveBeenCalled();
	});
});
