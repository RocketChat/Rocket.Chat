// deno-lint-ignore-file no-explicit-any
import { afterAll, beforeEach, describe, it } from 'https://deno.land/std@0.203.0/testing/bdd.ts';
import { assertSpyCall, spy } from 'https://deno.land/std@0.203.0/testing/mock.ts';
import { assert, assertEquals, assertNotInstanceOf, assertRejects } from 'https://deno.land/std@0.203.0/assert/mod.ts';

import { AppObjectRegistry } from '../../../AppObjectRegistry.ts';
import { ModifyCreator } from '../modify/ModifyCreator.ts';

describe('ModifyCreator', () => {
    const senderFn = (r: any) =>
        Promise.resolve({
            id: Math.random().toString(36).substring(2),
            jsonrpc: '2.0',
            result: r,
            serialize() {
                return JSON.stringify(this);
            },
        });

    beforeEach(() => {
        AppObjectRegistry.clear();
        AppObjectRegistry.set('id', 'deno-test');
    });

    afterAll(() => {
        AppObjectRegistry.clear();
    });

    it('sends the correct payload in the request to create a message', async () => {
        const spying = spy(senderFn);
        const modifyCreator = new ModifyCreator(spying);
        const messageBuilder = modifyCreator.startMessage();

        // Importing types from the Apps-Engine is problematic, so we'll go with `any` here
        messageBuilder
            .setRoom({ id: '123' } as any)
            .setSender({ id: '456' } as any)
            .setText('Hello World')
            .setUsernameAlias('alias')
            .setAvatarUrl('https://avatars.com/123');

        // We can't get a legitimate return value here, so we ignore it
        // but we need to know that the request sent was well formed
        await modifyCreator.finish(messageBuilder);

        assertSpyCall(spying, 0, {
            args: [
                {
                    method: 'bridges:getMessageBridge:doCreate',
                    params: [
                        {
                            room: { id: '123' },
                            sender: { id: '456' },
                            text: 'Hello World',
                            alias: 'alias',
                            avatarUrl: 'https://avatars.com/123',
                        },
                        'deno-test',
                    ],
                },
            ],
        });
    });

    it('sends the correct payload in the request to upload a buffer', async () => {
        const modifyCreator = new ModifyCreator(senderFn);

        const result = await modifyCreator.getUploadCreator().uploadBuffer(new Uint8Array([1, 2, 3, 4]), 'text/plain');

        assertEquals(result, {
            method: 'accessor:getModifier:getCreator:getUploadCreator:uploadBuffer',
            params: [new Uint8Array([1, 2, 3, 4]), 'text/plain'],
        });
    });

    it('sends the correct payload in the request to create a visitor', async () => {
        const modifyCreator = new ModifyCreator(senderFn);

        const result = (await modifyCreator.getLivechatCreator().createVisitor({
            token: 'random token',
            username: 'random username for visitor',
            name: 'Random Visitor',
        })) as any; // We modified the send function so it changed the original return type of the function

        assertEquals(result, {
            method: 'accessor:getModifier:getCreator:getLivechatCreator:createVisitor',
            params: [
                {
                    token: 'random token',
                    username: 'random username for visitor',
                    name: 'Random Visitor',
                },
            ],
        });
    });

    // This test is important because if we return a promise we break API compatibility
    it('does not return a promise for calls of the createToken() method of the LivechatCreator', () => {
        const modifyCreator = new ModifyCreator(senderFn);

        const result = modifyCreator.getLivechatCreator().createToken();

        assertNotInstanceOf(result, Promise);
        assert(typeof result === 'string', `Expected "${result}" to be of type "string", but got "${typeof result}"`);
    });

    it('throws an error when a proxy method of getLivechatCreator fails', async () => {
        const failingSenderFn = () => Promise.reject(new Error('Test error'));
        const modifyCreator = new ModifyCreator(failingSenderFn);
        const livechatCreator = modifyCreator.getLivechatCreator();

        await assertRejects(
            () =>
                livechatCreator.createAndReturnVisitor({
                    token: 'visitor-token',
                    username: 'visitor-username',
                    name: 'Visitor Name',
                }),
            Error,
            'Test error',
        );
    });

    it('throws an instance of Error when getLivechatCreator fails with a specific error object', async () => {
        const failingSenderFn = () => Promise.reject({ error: { message: 'Livechat method error' } });
        const modifyCreator = new ModifyCreator(failingSenderFn);
        const livechatCreator = modifyCreator.getLivechatCreator();

        await assertRejects(
            () =>
                livechatCreator.createVisitor({
                    token: 'visitor-token',
                    username: 'visitor-username',
                    name: 'Visitor Name',
                }),
            Error,
            'Livechat method error',
        );
    });

    it('throws a default Error when getLivechatCreator fails with an unknown error object', async () => {
        const failingSenderFn = () => Promise.reject({ error: {} });
        const modifyCreator = new ModifyCreator(failingSenderFn);
        const livechatCreator = modifyCreator.getLivechatCreator();

        await assertRejects(
            () =>
                livechatCreator.createVisitor({
                    token: 'visitor-token',
                    username: 'visitor-username',
                    name: 'Visitor Name',
                }),
            Error,
            '[object Object]',
        );
    });

    it('throws an error when a proxy method of getUploadCreator fails', async () => {
        const failingSenderFn = () => Promise.reject(new Error('Upload error'));
        const modifyCreator = new ModifyCreator(failingSenderFn);
        const uploadCreator = modifyCreator.getUploadCreator();

        await assertRejects(() => uploadCreator.uploadBuffer(new Uint8Array([9, 10, 11, 12]), 'image/png'), Error, 'Upload error');
    });

    it('throws an instance of Error when getUploadCreator fails with a specific error object', async () => {
        const failingSenderFn = () => Promise.reject({ error: { message: 'Upload method error' } });
        const modifyCreator = new ModifyCreator(failingSenderFn);
        const uploadCreator = modifyCreator.getUploadCreator();

        await assertRejects(() => uploadCreator.uploadBuffer(new Uint8Array([1, 2, 3]), 'image/png'), Error, 'Upload method error');
    });

    it('throws a default Error when getUploadCreator fails with an unknown error object', async () => {
        const failingSenderFn = () => Promise.reject({ error: {} });
        const modifyCreator = new ModifyCreator(failingSenderFn);
        const uploadCreator = modifyCreator.getUploadCreator();

        await assertRejects(() => uploadCreator.uploadBuffer(new Uint8Array([1, 2, 3]), 'image/png'), Error, '[object Object]');
    });

    it('throws an error when a proxy method of getEmailCreator fails', async () => {
        const failingSenderFn = () => Promise.reject(new Error('Email error'));
        const modifyCreator = new ModifyCreator(failingSenderFn);
        const emailCreator = modifyCreator.getEmailCreator();

        await assertRejects(
            () =>
                emailCreator.send({
                    to: 'test@example.com',
                    from: 'sender@example.com',
                    subject: 'Test Email',
                    text: 'This is a test email.',
                }),
            Error,
            'Email error',
        );
    });

    it('throws an instance of Error when getEmailCreator fails with a specific error object', async () => {
        const failingSenderFn = () => Promise.reject({ error: { message: 'Email method error' } });
        const modifyCreator = new ModifyCreator(failingSenderFn);
        const emailCreator = modifyCreator.getEmailCreator();

        await assertRejects(
            () =>
                emailCreator.send({
                    to: 'test@example.com',
                    from: 'sender@example.com',
                    subject: 'Test Email',
                    text: 'This is a test email.',
                }),
            Error,
            'Email method error',
        );
    });

    it('throws a default Error when getEmailCreator fails with an unknown error object', async () => {
        const failingSenderFn = () => Promise.reject({ error: {} });
        const modifyCreator = new ModifyCreator(failingSenderFn);
        const emailCreator = modifyCreator.getEmailCreator();

        await assertRejects(
            () =>
                emailCreator.send({
                    to: 'test@example.com',
                    from: 'sender@example.com',
                    subject: 'Test Email',
                    text: 'This is a test email.',
                }),
            Error,
            '[object Object]',
        );
    });

    it('throws an error when a proxy method of getContactCreator fails', async () => {
        const failingSenderFn = () => Promise.reject(new Error('Contact creation error'));
        const modifyCreator = new ModifyCreator(failingSenderFn);
        const contactCreator = modifyCreator.getContactCreator();

        await assertRejects(() => contactCreator.addContactEmail('test-contact-id', 'test@example.com'), Error, 'Contact creation error');
    });

    it('throws an instance of Error when getContactCreator fails with a specific error object', async () => {
        const failingSenderFn = () => Promise.reject({ error: { message: 'Contact creation error' } });
        const modifyCreator = new ModifyCreator(failingSenderFn);
        const contactCreator = modifyCreator.getContactCreator();

        await assertRejects(() => contactCreator.addContactEmail('test-contact-id', 'test@example.com'), Error, 'Contact creation error');
    });

    it('throws a default Error when getContactCreator fails with an unknown error object', async () => {
        const failingSenderFn = () => Promise.reject({ error: {} });
        const modifyCreator = new ModifyCreator(failingSenderFn);
        const contactCreator = modifyCreator.getContactCreator();

        await assertRejects(() => contactCreator.addContactEmail('test-contact-id', 'test@example.com'), Error, '[object Object]');
    });
});
