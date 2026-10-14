import { afterEach, describe, it, mock } from 'node:test';

import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook } from '@testing-library/react';
import { expect } from 'expect';
import { ModuleMocker, mocked } from 'jest-mock';
import type { FunctionLike } from 'jest-mock';

import { createFakeMessage, createFakeRoom, createFakeSubscription, createFakeUser } from '../../../../tests/mocks/data';

const mocker = new ModuleMocker(globalThis);
const fn: ModuleMocker['fn'] = mocker.fn.bind(mocker);
mock.module('../../../lib/rooms/roomCoordinator', {
	exports: {
		roomCoordinator: {
			openRouteLink: fn<FunctionLike>(),
		},
	},
});
const { useReplyInDMAction }: typeof import('./useReplyInDMAction') = require('./useReplyInDMAction');
const { roomCoordinator }: typeof import('../../../lib/rooms/roomCoordinator') = require('../../../lib/rooms/roomCoordinator');

const mockedOpenRouteLink = mocked(roomCoordinator.openRouteLink);

const currentUser = createFakeUser({
	_id: 'current-user-id',
	username: 'currentuser',
});

const messageAuthor = {
	_id: 'author-user-id',
	username: 'authoruser',
	name: 'Author User',
};

const message = createFakeMessage({
	_id: 'reply-message-id',
	u: messageAuthor,
});

const room = createFakeRoom({
	_id: 'channel-id',
	t: 'c',
	name: 'general',
});

const subscription = createFakeSubscription({
	rid: 'channel-id',
	t: 'c',
});

afterEach(() => {
	mocker.clearAllMocks();
});

describe('useReplyInDMAction', () => {
	it('should not carry over the msg search parameter when opening a direct message', () => {
		const getSearchParameters = fn<FunctionLike>().mockReturnValue({
			msg: 'stale-message-id',
			layout: 'embedded',
		});

		const { result } = renderHook(() => useReplyInDMAction(message, { room, subscription }), {
			wrapper: mockAppRoot().withUser(currentUser).withPermission('create-d').withRouter({ getSearchParameters }).build(),
		});

		expect(result.current).not.toBeNull();

		result.current?.action({ stopPropagation: fn<FunctionLike>() } as unknown as UIEvent);

		expect(getSearchParameters).toHaveBeenCalled();
		expect(mockedOpenRouteLink).toHaveBeenCalledWith(
			'd',
			{ name: messageAuthor.username },
			{
				layout: 'embedded',
				reply: 'reply-message-id',
			},
		);

		const searchParams = mockedOpenRouteLink.mock.calls[0]?.[2];
		expect(searchParams).not.toHaveProperty('msg');
	});

	it('should return null when already in a direct message room', () => {
		const dmRoom = createFakeRoom({ t: 'd' });
		const dmSubscription = createFakeSubscription({ t: 'd' });

		const { result } = renderHook(() => useReplyInDMAction(message, { room: dmRoom, subscription: dmSubscription }), {
			wrapper: mockAppRoot().withUser(currentUser).withPermission('create-d').build(),
		});

		expect(result.current).toBeNull();
	});
});
