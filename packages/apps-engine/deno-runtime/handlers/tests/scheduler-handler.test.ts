import { assertEquals } from 'https://deno.land/std@0.203.0/assert/mod.ts';
import { afterAll, beforeEach, describe, it } from 'https://deno.land/std@0.203.0/testing/bdd.ts';

import { AppObjectRegistry } from '../../AppObjectRegistry.ts';
import { AppAccessors } from '../../lib/accessors/mod.ts';
import handleScheduler from '../scheduler-handler.ts';

describe('handlers > scheduler', () => {
    const mockAppAccessors = new AppAccessors(() =>
        Promise.resolve({
            id: 'mockId',
            result: {},
            jsonrpc: '2.0',
            serialize: () => '',
        }),
    );

    const mockApp = {
        getID: () => 'mockApp',
        getLogger: () => ({
            debug: () => {},
            error: () => {},
        }),
    };

    beforeEach(() => {
        AppObjectRegistry.clear();
        AppObjectRegistry.set('app', mockApp);
        mockAppAccessors.getConfigurationExtend().scheduler.registerProcessors([
            {
                id: 'mockId',
                processor: () => Promise.resolve('it works!'),
            },
        ]);
    });

    afterAll(() => {
        AppObjectRegistry.clear();
    });

    it('correctly executes a request to a processor', async () => {
        const result = await handleScheduler('scheduler:mockId', [{}]);

        assertEquals(result, null);
    });
});
