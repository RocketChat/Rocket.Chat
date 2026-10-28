import * as assert from 'node:assert';
import { beforeEach, describe, it, mock } from 'node:test';

import type { IRead, IModify, IHttp, IPersistence } from '@rocket.chat/apps-engine/definition/accessors';
import type { ISlashCommand, SlashCommandContext } from '@rocket.chat/apps-engine/definition/slashcommands';

import { AppObjectRegistry } from '../../AppObjectRegistry';
import { createMockRequest } from './helpers/mod';
import type { AppAccessors } from '../../lib/accessors/mod';
import { Room } from '../../lib/room';
import { handleExecutor, handlePreviewItem } from '../slashcommand-handler';

describe('handlers > slashcommand', () => {
	const mockAppAccessors = {
		getReader: () => ({ __type: 'reader' }),
		getHttp: () => ({ __type: 'http' }),
		getModifier: () => ({ __type: 'modifier' }),
		getPersistence: () => ({ __type: 'persistence' }),
		getSenderFn: () => (id: string) => Promise.resolve([{ __type: 'bridgeCall' }, { id }]),
	} as unknown as AppAccessors;

	const mockCommandExecutorOnly: ISlashCommand = {
		command: 'executor-only',
		i18nParamsExample: 'test',
		i18nDescription: 'test',
		providesPreview: false,
		executor(_context: SlashCommandContext, _read: IRead, _modify: IModify, _http: IHttp, _persis: IPersistence): Promise<void> {
			return Promise.resolve();
		},
	};

	const mockCommandExecutorAndPreview: ISlashCommand = {
		command: 'executor-and-preview',
		i18nParamsExample: 'test',
		i18nDescription: 'test',
		providesPreview: true,
		executor(_context: SlashCommandContext, _read: IRead, _modify: IModify, _http: IHttp, _persis: IPersistence): Promise<void> {
			return Promise.resolve();
		},
		previewer(_context, _read, _modify, _http, _persis) {
			return Promise.resolve({ i18nTitle: 'test', items: [] });
		},
		executePreviewItem(_item, _context, _read, _modify, _http, _persis) {
			return Promise.resolve();
		},
	};

	beforeEach(() => {
		AppObjectRegistry.clear();
		AppObjectRegistry.set('slashcommand:executor-only', mockCommandExecutorOnly);
		AppObjectRegistry.set('slashcommand:executor-and-preview', mockCommandExecutorAndPreview);
	});

	it('correctly handles execution of a slash command', async () => {
		const mockContext = {
			sender: { __type: 'sender' },
			room: { __type: 'room' },
			params: { __type: 'params' },
			threadId: 'threadId',
			triggerId: 'triggerId',
		};

		const _spy = mock.method(mockCommandExecutorOnly, 'executor');

		const mockRequest = createMockRequest({ method: 'slashcommand:executor-only:executor', params: [mockContext] });

		await handleExecutor({ AppAccessorsInstance: mockAppAccessors, request: mockRequest }, mockCommandExecutorOnly, 'executor', [
			mockContext,
		]);

		const context = _spy.mock.calls[0].arguments[0];

		assert.ok(context.getRoom() instanceof Room, `Expected instance of ${Room.name}`);
		assert.deepStrictEqual(context.getSender(), { __type: 'sender' });
		assert.deepStrictEqual(context.getArguments(), { __type: 'params' });
		assert.deepStrictEqual(context.getThreadId(), 'threadId');
		assert.deepStrictEqual(context.getTriggerId(), 'triggerId');

		assert.deepStrictEqual(_spy.mock.calls[0].arguments[1], mockAppAccessors.getReader());
		assert.deepStrictEqual(_spy.mock.calls[0].arguments[2], mockAppAccessors.getModifier());
		assert.deepStrictEqual(_spy.mock.calls[0].arguments[3], mockAppAccessors.getHttp());
		assert.deepStrictEqual(_spy.mock.calls[0].arguments[4], mockAppAccessors.getPersistence());

		_spy.mock.restore();
	});

	it('correctly handles execution of a slash command previewer', async () => {
		const mockContext = {
			sender: { __type: 'sender' },
			room: { __type: 'room' },
			params: { __type: 'params' },
			threadId: 'threadId',
			triggerId: 'triggerId',
		};

		const _spy = mock.method(mockCommandExecutorAndPreview, 'previewer');

		const mockRequest = createMockRequest({ method: 'slashcommand:executor-and-preview:previewer', params: [mockContext] });

		await handleExecutor({ AppAccessorsInstance: mockAppAccessors, request: mockRequest }, mockCommandExecutorAndPreview, 'previewer', [
			mockContext,
		]);

		const context = _spy.mock.calls[0].arguments[0];

		assert.ok(context.getRoom() instanceof Room, `Expected instance of ${Room.name}`);
		assert.deepStrictEqual(context.getSender(), { __type: 'sender' });
		assert.deepStrictEqual(context.getArguments(), { __type: 'params' });
		assert.deepStrictEqual(context.getThreadId(), 'threadId');
		assert.deepStrictEqual(context.getTriggerId(), 'triggerId');

		assert.deepStrictEqual(_spy.mock.calls[0].arguments[1], mockAppAccessors.getReader());
		assert.deepStrictEqual(_spy.mock.calls[0].arguments[2], mockAppAccessors.getModifier());
		assert.deepStrictEqual(_spy.mock.calls[0].arguments[3], mockAppAccessors.getHttp());
		assert.deepStrictEqual(_spy.mock.calls[0].arguments[4], mockAppAccessors.getPersistence());

		_spy.mock.restore();
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

		const _spy = mock.method(mockCommandExecutorAndPreview, 'executePreviewItem');

		const mockRequest = createMockRequest({
			method: 'slashcommand:executor-and-preview:executePreviewItem',
			params: [mockPreviewItem, mockContext],
		});

		await handlePreviewItem({ AppAccessorsInstance: mockAppAccessors, request: mockRequest }, mockCommandExecutorAndPreview, [
			mockPreviewItem,
			mockContext,
		]);

		const context = _spy.mock.calls[0].arguments[1];

		assert.ok(context.getRoom() instanceof Room, `Expected instance of ${Room.name}`);
		assert.deepStrictEqual(context.getSender(), { __type: 'sender' });
		assert.deepStrictEqual(context.getArguments(), { __type: 'params' });
		assert.deepStrictEqual(context.getThreadId(), 'threadId');
		assert.deepStrictEqual(context.getTriggerId(), 'triggerId');

		assert.deepStrictEqual(_spy.mock.calls[0].arguments[2], mockAppAccessors.getReader());
		assert.deepStrictEqual(_spy.mock.calls[0].arguments[3], mockAppAccessors.getModifier());
		assert.deepStrictEqual(_spy.mock.calls[0].arguments[4], mockAppAccessors.getHttp());
		assert.deepStrictEqual(_spy.mock.calls[0].arguments[5], mockAppAccessors.getPersistence());

		_spy.mock.restore();
	});
});
