import { afterEach, describe, it } from 'node:test';

import { expect } from 'expect';
import { ModuleMocker, mocked } from 'jest-mock';
import type { FunctionLike } from 'jest-mock';
import proxyquire from 'proxyquire';

import { createFakeMessage } from '../../../tests/mocks/data';
import { slashCommands } from '../../lib/slashCommand';

const mocker = new ModuleMocker(globalThis);
const fn: ModuleMocker['fn'] = mocker.fn.bind(mocker);
const queryClientMock = {
	queryClient: {
		invalidateQueries: fn<FunctionLike>(),
	},
};

const { queryClient } = queryClientMock as unknown as typeof import('../../lib/queryClient');

proxyquire.noCallThru().load<typeof import('./kick')>('./kick', {
	'../../lib/queryClient': queryClientMock,
});

const invalidateQueries = mocked(queryClient.invalidateQueries);

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
		mocker.clearAllMocks();
	});

	(
		[
			['an unadorned username', 'alice'],
			['surrounding whitespace', '  alice  '],
			['an @ prefix and surrounding whitespace', '  @alice  '],
		] as const
	).forEach(([_case, input]) => {
		it(`returns the normalized username when given ${_case}`, () => {
			expect(runCommand(input)).toBe('alice');
		});
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
