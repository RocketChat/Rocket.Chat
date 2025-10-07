import type { MessageActionContext } from '@rocket.chat/apps-engine/definition/ui';
import type { IMessage, IRoom } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook } from '@testing-library/react';

import { usePermalinkAction } from './usePermalinkAction';
import type { MessageActionConfig } from '../../../../app/ui-utils/client/lib/MessageAction';
import { createFakeUser } from '../../../../tests/mocks/data';

// Mock the getPermaLink function
jest.mock('../../../lib/getPermaLink', () => ({
	getPermaLink: jest.fn(() => Promise.resolve('https://example.com/permalink')),
}));

const user = createFakeUser({
	_id: 'current-user-id',
	username: 'currentuser',
	active: true,
	roles: ['admin'],
	type: 'user',
});

const appRoot = mockAppRoot()
	.withUser(user)
	.withTranslations('en', 'core', {
		Copy_link: 'Copy link',
		Copied: 'Copied',
	})
	.build();

const createMockMessage = (overrides: Partial<IMessage> = {}): IMessage => ({
	_id: 'message-id',
	rid: 'room-id',
	msg: 'Test message',
	ts: new Date(),
	u: { _id: 'user-id', username: 'testuser' },
	_updatedAt: new Date(),
	channels: [],
	file: { _id: 'file-id', name: 'file.txt', type: 'text/plain', size: 100, format: 'text/plain' },
	mentions: [],
	reactions: {},
	starred: [],
	...overrides,
});

const createMockRoom = (overrides: Partial<IRoom> = {}): IRoom => ({
	_id: 'room-id',
	t: 'c' as const,
	name: 'test-room',
	msgs: 0,
	u: { _id: 'user-id', username: 'testuser' },
	usersCount: 1,
	_updatedAt: new Date(),
	...overrides,
});

describe('usePermalinkAction', () => {
	it('should be enabled for normal messages', () => {
		const message = createMockMessage();
		const room = createMockRoom();
		const config = {
			id: 'permalink',
			context: ['message', 'message-mobile'],
			type: 'communication',
			order: 0,
		} as { context: MessageActionContext[]; order: number } & Pick<MessageActionConfig, 'id' | 'type'>;

		const { result } = renderHook(() => usePermalinkAction(message, config, { room }), { wrapper: appRoot });

		expect(result.current).toEqual({
			id: 'permalink',
			icon: 'permalink',
			label: 'Copy_link',
			context: ['message', 'message-mobile'],
			type: 'communication',
			action: expect.any(Function),
			order: 0,
			group: 'menu',
			disabled: false,
		});
	});
	it('should be disabled for encrypted messages', () => {
		const message = createMockMessage({
			t: 'e2e',
			e2e: 'done',
		});
		const room = createMockRoom();
		const config = {
			id: 'permalink',
			context: ['message', 'message-mobile'],
			type: 'communication',
			order: 0,
		} as { context: MessageActionContext[]; order: number } & Pick<MessageActionConfig, 'id' | 'type'>;

		const { result } = renderHook(() => usePermalinkAction(message, config, { room }), { wrapper: appRoot });

		expect(result.current).toEqual({
			id: 'permalink',
			icon: 'permalink',
			label: 'Copy_link',
			context: ['message', 'message-mobile'],
			type: 'communication',
			action: expect.any(Function),
			order: 0,
			group: 'menu',
			disabled: true,
			tooltip: 'Action_not_available_encrypted_content',
		});
	});

	it('should be disabled for ABAC rooms', () => {
		const message = createMockMessage();
		const room = createMockRoom({
			// @ts-expect-error to be implemented
			abacAttributes: { someAttribute: 'value' },
		});
		const config = {
			id: 'permalink',
			context: ['message', 'message-mobile'],
			type: 'communication',
			order: 0,
		} as { context: MessageActionContext[]; order: number } & Pick<MessageActionConfig, 'id' | 'type'>;

		const { result } = renderHook(() => usePermalinkAction(message, config, { room }), { wrapper: appRoot });

		expect(result.current).toEqual({
			id: 'permalink',
			icon: 'permalink',
			label: 'Copy_link',
			context: ['message', 'message-mobile'],
			type: 'communication',
			action: expect.any(Function),
			order: 0,
			group: 'menu',
			disabled: true,
			tooltip: 'Not_available_for_ABAC_enabled_rooms',
		});
	});

	it('should be disabled for both encrypted messages and ABAC rooms', () => {
		const message = createMockMessage({
			t: 'e2e',
			e2e: 'done',
		});
		const room = createMockRoom({
			// @ts-expect-error to be implemented
			abacAttributes: { someAttribute: 'value' },
		});
		const config = {
			id: 'permalink',
			context: ['message', 'message-mobile'],
			type: 'communication',
			order: 0,
		} as { context: MessageActionContext[]; order: number } & Pick<MessageActionConfig, 'id' | 'type'>;

		const { result } = renderHook(() => usePermalinkAction(message, config, { room }), { wrapper: appRoot });

		expect(result.current).toEqual({
			id: 'permalink',
			icon: 'permalink',
			label: 'Copy_link',
			context: ['message', 'message-mobile'],
			type: 'communication',
			action: expect.any(Function),
			order: 0,
			group: 'menu',
			disabled: true,
			tooltip: 'Action_not_available_encrypted_content',
		});
	});
});
