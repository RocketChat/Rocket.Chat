import { afterAll, beforeEach, describe, it } from 'https://deno.land/std@0.203.0/testing/bdd.ts';
import { assertEquals } from 'https://deno.land/std@0.203.0/assert/assert_equals.ts';

import { AppAccessors } from '../mod.ts';
import { AppObjectRegistry } from '../../../AppObjectRegistry.ts';

describe('AppAccessors', () => {
    let appAccessors: AppAccessors;
    const senderFn = (r: object) =>
        Promise.resolve({
            id: Math.random().toString(36).substring(2),
            jsonrpc: '2.0',
            result: r,
            serialize() {
                return JSON.stringify(this);
            },
        });

    beforeEach(() => {
        appAccessors = new AppAccessors(senderFn);
        AppObjectRegistry.clear();
    });

    afterAll(() => {
        AppObjectRegistry.clear();
    });

    it('creates the correct format for IRead calls', async () => {
        const roomRead = appAccessors.getReader().getRoomReader();
        const room = await roomRead.getById('123');

        assertEquals(room, {
            params: ['123'],
            method: 'accessor:getReader:getRoomReader:getById',
        });
    });

    it('creates the correct format for IEnvironmentRead calls from IRead', async () => {
        const reader = appAccessors.getReader().getEnvironmentReader().getEnvironmentVariables();
        const room = await reader.getValueByName('NODE_ENV');

        assertEquals(room, {
            params: ['NODE_ENV'],
            method: 'accessor:getReader:getEnvironmentReader:getEnvironmentVariables:getValueByName',
        });
    });

    it('creates the correct format for IEvironmentRead calls', async () => {
        const envRead = appAccessors.getEnvironmentRead();
        const env = await envRead.getServerSettings().getValueById('123');

        assertEquals(env, {
            params: ['123'],
            method: 'accessor:getEnvironmentRead:getServerSettings:getValueById',
        });
    });

    it('creates the correct format for IEvironmentWrite calls', async () => {
        const envRead = appAccessors.getEnvironmentWrite();
        const env = await envRead.getServerSettings().incrementValue('123', 6);

        assertEquals(env, {
            params: ['123', 6],
            method: 'accessor:getEnvironmentWrite:getServerSettings:incrementValue',
        });
    });

    it('creates the correct format for IConfigurationModify calls', async () => {
        const configModify = appAccessors.getConfigurationModify();
        const command = await configModify.slashCommands.modifySlashCommand({
            command: 'test',
            i18nDescription: 'test',
            i18nParamsExample: 'test',
            providesPreview: true,
        });

        assertEquals(command, {
            params: [
                {
                    command: 'test',
                    i18nDescription: 'test',
                    i18nParamsExample: 'test',
                    providesPreview: true,
                },
            ],
            method: 'accessor:getConfigurationModify:slashCommands:modifySlashCommand',
        });
    });

    it('correctly stores a reference to a slashcommand object and sends a request via proxy', async () => {
        const configExtend = appAccessors.getConfigurationExtend();

        const slashcommand = {
            command: 'test',
            i18nDescription: 'test',
            i18nParamsExample: 'test',
            providesPreview: true,
            executor() {
                return Promise.resolve();
            },
        };

        const result = await configExtend.slashCommands.provideSlashCommand(slashcommand);

        assertEquals(AppObjectRegistry.get('slashcommand:test'), slashcommand);

        // The function will not be serialized and sent to the main process
        delete result.params[0].executor;

        assertEquals(result, {
            method: 'accessor:getConfigurationExtend:slashCommands:provideSlashCommand',
            params: [
                {
                    command: 'test',
                    i18nDescription: 'test',
                    i18nParamsExample: 'test',
                    providesPreview: true,
                },
            ],
        });
    });
});
