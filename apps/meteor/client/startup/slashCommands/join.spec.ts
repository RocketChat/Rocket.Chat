import { createFakeMessage } from '../../../tests/mocks/data';
import { slashCommands } from '../../lib/slashCommand';

import './join';

const getResultHandler = () => {
	const { result } = slashCommands.commands.join;
	expect(result).toBeDefined();
	return result as NonNullable<typeof result>;
};

describe('/join slash command', () => {
	afterEach(() => {
		jest.restoreAllMocks();
	});

	it('redirects to /open and rewrites the command message when the user is already in the room', () => {
		const result = getResultHandler();
		const run = jest.spyOn(slashCommands, 'run').mockResolvedValue(undefined);
		const params = {
			cmd: 'join',
			params: 'general',
			msg: createFakeMessage({ _id: 'message-id', rid: 'room-id', msg: '/join general' }),
			userId: 'user-id',
		};

		result({ error: 'error-user-already-in-room' }, undefined, params);

		expect(params.cmd).toBe('open');
		expect(params.msg.msg).toBe('/open general');
		expect(run).toHaveBeenCalledWith({
			command: 'open',
			params: 'general',
			message: params.msg,
			triggerId: '',
			userId: 'user-id',
		});
	});

	it.each([
		['a successful result', undefined],
		['an unrelated structured error', { error: 'error-not-allowed' }],
		['a generic error', new Error('Unexpected error')],
	])('does not redirect to /open for %s', (_case, error) => {
		const result = getResultHandler();
		const run = jest.spyOn(slashCommands, 'run').mockResolvedValue(undefined);
		const params = {
			cmd: 'join',
			params: 'general',
			msg: createFakeMessage({ _id: 'message-id', rid: 'room-id', msg: '/join general' }),
			userId: 'user-id',
		};

		result(error, undefined, params);

		expect(params.cmd).toBe('join');
		expect(params.msg.msg).toBe('/join general');
		expect(run).not.toHaveBeenCalled();
	});
});
