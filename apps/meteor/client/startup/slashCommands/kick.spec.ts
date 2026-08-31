import { createFakeMessage } from '../../../tests/mocks/data';
import { queryClient } from '../../lib/queryClient';
import { slashCommands } from '../../lib/slashCommand';

import './kick';

jest.mock('../../lib/queryClient', () => ({
	queryClient: {
		invalidateQueries: jest.fn(),
	},
}));

const { callback, result } = slashCommands.commands.kick;
const invalidateQueries = jest.mocked(queryClient.invalidateQueries);

const callbackParams = (params: string) => ({
	command: 'kick',
	params,
	message: { _id: 'message-id', rid: 'room-id' },
	userId: 'user-id',
});

describe('/kick slash command', () => {
	afterEach(() => {
		jest.clearAllMocks();
	});

	it('trims the supplied username', () => {
		expect(callback?.(callbackParams('  alice  '))).toBe('alice');
	});

	it('removes the @ prefix', () => {
		expect(callback?.(callbackParams('@alice'))).toBe('alice');
	});

	it('handles empty input', () => {
		expect(callback?.(callbackParams('   '))).toBeUndefined();
	});

	it('invalidates the room-members query after success', () => {
		result?.(undefined, undefined, {
			cmd: 'kick',
			params: 'alice',
			msg: createFakeMessage({ rid: 'room-id' }),
		});

		expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['rooms', 'room-id', 'members'] });
	});

	it('does not invalidate the room-members query after an error', () => {
		result?.(new Error('Failed to kick user'), undefined, {
			cmd: 'kick',
			params: 'alice',
			msg: createFakeMessage({ rid: 'room-id' }),
		});

		expect(invalidateQueries).not.toHaveBeenCalled();
	});
});
