// deno-lint-ignore-file no-explicit-any
import { assertEquals, assertInstanceOf } from 'https://deno.land/std@0.203.0/assert/mod.ts';
import { beforeEach, describe, it } from 'https://deno.land/std@0.203.0/testing/bdd.ts';
import { spy } from 'https://deno.land/std@0.203.0/testing/mock.ts';

import { AppObjectRegistry } from '../../AppObjectRegistry.ts';
import { AppAccessors } from '../../lib/accessors/mod.ts';
import { handleExecutor, handlePreviewItem } from '../slashcommand-handler.ts';
import { Room } from "../../lib/room.ts";

describe('handlers > slashcommand', () => {
    const mockAppAccessors = {
        getReader: () => ({ __type: 'reader' }),
        getHttp: () => ({ __type: 'http' }),
        getModifier: () => ({ __type: 'modifier' }),
        getPersistence: () => ({ __type: 'persistence' }),
        getSenderFn: () => (id: string) => Promise.resolve([{ __type: 'bridgeCall' }, { id }]),
    } as unknown as AppAccessors;

    const mockCommandExecutorOnly = {
        command: 'executor-only',
        i18nParamsExample: 'test',
        i18nDescription: 'test',
        providesPreview: false,
        // deno-lint-ignore no-unused-vars
        async executor(context: any, read: any, modify: any, http: any, persis: any): Promise<void> {},
    };

    const mockCommandExecutorAndPreview = {
        command: 'executor-and-preview',
        i18nParamsExample: 'test',
        i18nDescription: 'test',
        providesPreview: true,
        // deno-lint-ignore no-unused-vars
        async executor(context: any, read: any, modify: any, http: any, persis: any): Promise<void> {},
        // deno-lint-ignore no-unused-vars
        async previewer(context: any, read: any, modify: any, http: any, persis: any): Promise<void> {},
        // deno-lint-ignore no-unused-vars
        async executePreviewItem(previewItem: any, context: any, read: any, modify: any, http: any, persis: any): Promise<void> {},
    };

    const mockCommandPreviewWithNoExecutor = {
        command: 'preview-with-no-executor',
        i18nParamsExample: 'test',
        i18nDescription: 'test',
        providesPreview: true,
        // deno-lint-ignore no-unused-vars
        async previewer(context: any, read: any, modify: any, http: any, persis: any): Promise<void> {},
        // deno-lint-ignore no-unused-vars
        async executePreviewItem(previewItem: any, context: any, read: any, modify: any, http: any, persis: any): Promise<void> {},
    };

    beforeEach(() => {
        AppObjectRegistry.clear();
        AppObjectRegistry.set('slashcommand:executor-only', mockCommandExecutorOnly);
        AppObjectRegistry.set('slashcommand:executor-and-preview', mockCommandExecutorAndPreview);
        AppObjectRegistry.set('slashcommand:preview-with-no-executor', mockCommandPreviewWithNoExecutor);
    });

    it('correctly handles execution of a slash command', async () => {
        const mockContext = {
            sender: { __type: 'sender' },
            room: { __type: 'room' },
            params: { __type: 'params' },
            threadId: 'threadId',
            triggerId: 'triggerId',
        };

        const _spy = spy(mockCommandExecutorOnly, 'executor');

        await handleExecutor({ AppAccessorsInstance: mockAppAccessors }, mockCommandExecutorOnly, 'executor', [mockContext]);

        const context = _spy.calls[0].args[0];

        assertInstanceOf(context.getRoom(), Room);
        assertEquals(context.getSender(), { __type: 'sender' });
        assertEquals(context.getArguments(), { __type: 'params' });
        assertEquals(context.getThreadId(), 'threadId');
        assertEquals(context.getTriggerId(), 'triggerId');

        assertEquals(_spy.calls[0].args[1], mockAppAccessors.getReader());
        assertEquals(_spy.calls[0].args[2], mockAppAccessors.getModifier());
        assertEquals(_spy.calls[0].args[3], mockAppAccessors.getHttp());
        assertEquals(_spy.calls[0].args[4], mockAppAccessors.getPersistence());

        _spy.restore();
    });

    it('correctly handles execution of a slash command previewer', async () => {
        const mockContext = {
            sender: { __type: 'sender' },
            room: { __type: 'room' },
            params: { __type: 'params' },
            threadId: 'threadId',
            triggerId: 'triggerId',
        };

        const _spy = spy(mockCommandExecutorAndPreview, 'previewer');

        await handleExecutor({ AppAccessorsInstance: mockAppAccessors }, mockCommandExecutorAndPreview, 'previewer', [mockContext]);

        const context = _spy.calls[0].args[0];

        assertInstanceOf(context.getRoom(), Room);
        assertEquals(context.getSender(), { __type: 'sender' });
        assertEquals(context.getArguments(), { __type: 'params' });
        assertEquals(context.getThreadId(), 'threadId');
        assertEquals(context.getTriggerId(), 'triggerId');

        assertEquals(_spy.calls[0].args[1], mockAppAccessors.getReader());
        assertEquals(_spy.calls[0].args[2], mockAppAccessors.getModifier());
        assertEquals(_spy.calls[0].args[3], mockAppAccessors.getHttp());
        assertEquals(_spy.calls[0].args[4], mockAppAccessors.getPersistence());

        _spy.restore();
    });

    it('correctly handles execution of a slash command preview item executor', async () => {
        const mockContext = {
            sender: { __type: 'sender' },
            room: { __type: 'room' },
            params: { __type: 'params' },
            threadId: 'threadId',
            triggerId: 'triggerId',
        };

        const mockPreviewItem = {
            id: 'previewItemId',
            type: 'image',
            value: 'https://example.com/image.png',
        };

        const _spy = spy(mockCommandExecutorAndPreview, 'executePreviewItem');

        await handlePreviewItem({ AppAccessorsInstance: mockAppAccessors }, mockCommandExecutorAndPreview, [mockPreviewItem, mockContext]);

        const context = _spy.calls[0].args[1];

        assertInstanceOf(context.getRoom(), Room);
        assertEquals(context.getSender(), { __type: 'sender' });
        assertEquals(context.getArguments(), { __type: 'params' });
        assertEquals(context.getThreadId(), 'threadId');
        assertEquals(context.getTriggerId(), 'triggerId');

        assertEquals(_spy.calls[0].args[2], mockAppAccessors.getReader());
        assertEquals(_spy.calls[0].args[3], mockAppAccessors.getModifier());
        assertEquals(_spy.calls[0].args[4], mockAppAccessors.getHttp());
        assertEquals(_spy.calls[0].args[5], mockAppAccessors.getPersistence());

        _spy.restore();
    });
});
