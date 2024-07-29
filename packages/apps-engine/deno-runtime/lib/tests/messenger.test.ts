import { assertEquals, assertObjectMatch } from 'https://deno.land/std@0.203.0/assert/mod.ts';
import { afterAll, beforeEach, describe, it } from 'https://deno.land/std@0.203.0/testing/bdd.ts';
import { spy } from 'https://deno.land/std@0.203.0/testing/mock.ts';

import * as Messenger from '../messenger.ts';
import { AppObjectRegistry } from '../../AppObjectRegistry.ts';
import { Logger } from '../logger.ts';

describe('Messenger', () => {
    beforeEach(() => {
        AppObjectRegistry.clear();
        AppObjectRegistry.set('logger', new Logger('test'));
        AppObjectRegistry.set('id', 'test');
        Messenger.Transport.selectTransport('noop');
    });

    afterAll(() => {
        AppObjectRegistry.clear();
        Messenger.Transport.selectTransport('stdout');
    });

    it('should add logs to success responses', async () => {
        const theSpy = spy(Messenger.Queue, 'enqueue');

        const logger = AppObjectRegistry.get<Logger>('logger') as Logger;

        logger.info('test');

        await Messenger.successResponse({ id: 'test', result: 'test' });

        assertEquals(theSpy.calls.length, 1);

        const [responseArgument] = theSpy.calls[0].args;

        assertObjectMatch(responseArgument, {
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

        const logger = AppObjectRegistry.get<Logger>('logger') as Logger;

        logger.info('test');

        await Messenger.errorResponse({ id: 'test', error: { code: -32000, message: 'test' } });

        assertEquals(theSpy.calls.length, 1);

        const [responseArgument] = theSpy.calls[0].args;

        assertObjectMatch(responseArgument, {
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
