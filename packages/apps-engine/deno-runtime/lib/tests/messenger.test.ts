import { assertEquals, assertObjectMatch } from 'https://deno.land/std@0.203.0/assert/mod.ts';
import { afterAll, beforeEach, describe, it } from 'https://deno.land/std@0.203.0/testing/bdd.ts';
import { spy } from 'https://deno.land/std@0.203.0/testing/mock.ts';

import * as Messenger from '../messenger.ts';
import { AppObjectRegistry } from '../../AppObjectRegistry.ts';
import { createMockRequest } from '../../handlers/tests/helpers/mod.ts';
import { RequestContext } from '../requestContext.ts';
import { JsonRpc } from 'jsonrpc-lite';

describe('Messenger', () => {
	let context: RequestContext;

	beforeEach(() => {
		AppObjectRegistry.clear();
		AppObjectRegistry.set('id', 'test');
		Messenger.Transport.selectTransport('noop');

		context = createMockRequest({ method: 'test', params: [] });
	});

	afterAll(() => {
		AppObjectRegistry.clear();
		Messenger.Transport.selectTransport('stdout');
	});

	it('should add logs to success responses', async () => {
		const theSpy = spy(Messenger.Queue, 'enqueue');
		const { logger } = context.context;

		logger.info('test');

		await Messenger.successResponse({ id: 'test', result: 'test' }, context);

		assertEquals(theSpy.calls.length, 1);

		const [responseArgument] = theSpy.calls[0].args;

		assertObjectMatch(responseArgument as JsonRpc, {
			jsonrpc: '2.0',
			id: 'test',
			result: {
				value: 'test',
				logs: {
					appId: 'test',
					method: 'test',
					entries: [
						{
							severity: 'info',
							method: 'test',
							args: ['test'],
							caller: 'anonymous OR constructor',
						},
					],
				},
			},
		});

		theSpy.restore();
	});

	it('should add logs to error responses', async () => {
		const theSpy = spy(Messenger.Queue, 'enqueue');
		const { logger } = context.context;

		logger.info('test');

		await Messenger.errorResponse({ id: 'test', error: { code: -32000, message: 'test' } }, context);

		assertEquals(theSpy.calls.length, 1);

		const [responseArgument] = theSpy.calls[0].args;

		assertObjectMatch(responseArgument as JsonRpc, {
			jsonrpc: '2.0',
			id: 'test',
			error: {
				code: -32000,
				message: 'test',
				data: {
					logs: {
						appId: 'test',
						method: 'test',
						entries: [
							{
								severity: 'info',
								method: 'test',
								args: ['test'],
								caller: 'anonymous OR constructor',
							},
						],
					},
				},
			},
		});

		theSpy.restore();
	});
});
