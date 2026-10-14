import { afterEach, describe, it, mock } from 'node:test';

import { expect } from 'expect';
import { ModuleMocker, mocked } from 'jest-mock';
import type { FunctionLike } from 'jest-mock';

import { createFakeMessage } from '../../../../tests/mocks/data';
import type { ChatAPI } from '../ChatAPI';

const mocker = new ModuleMocker(globalThis);
const fn: ModuleMocker['fn'] = mocker.fn.bind(mocker);
mock.module('../../rooms/roomCoordinator', {
	exports: {
		roomCoordinator: {
			openRouteLink: fn<FunctionLike>(),
		},
	},
});
mock.module('../../../providers/RouterProvider', {
	exports: {
		router: {
			getSearchParameters: fn<FunctionLike>(),
		},
	},
});
const { replyBroadcast }: typeof import('./replyBroadcast') = require('./replyBroadcast');
const { router }: typeof import('../../../providers/RouterProvider') = require('../../../providers/RouterProvider');
const { roomCoordinator }: typeof import('../../rooms/roomCoordinator') = require('../../rooms/roomCoordinator');

const mockedOpenRouteLink = mocked(roomCoordinator.openRouteLink);
const mockedGetSearchParameters = mocked(router.getSearchParameters);

const messageAuthor = {
	_id: 'author-user-id',
	username: 'authoruser',
	name: 'Author User',
};

const message = createFakeMessage({
	_id: 'reply-message-id',
	u: messageAuthor,
});

afterEach(() => {
	mocker.clearAllMocks();
});

describe('replyBroadcast', () => {
	it('should not carry over the msg search parameter when opening a direct message', async () => {
		mockedGetSearchParameters.mockReturnValue({
			msg: 'stale-message-id',
			layout: 'embedded',
		});

		await replyBroadcast({} as ChatAPI, message);

		expect(mockedGetSearchParameters).toHaveBeenCalled();
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
});
