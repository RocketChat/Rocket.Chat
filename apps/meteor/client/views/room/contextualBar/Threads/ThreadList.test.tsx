import { after, before, describe, it, mock } from 'node:test';

import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
import { expect } from 'expect';
import { fn } from 'jest-mock';
import type { FunctionLike } from 'jest-mock';
import { VirtuosoMockContext } from 'react-virtuoso';

import { createFakeRoom } from '../../../../../tests/mocks/data';
import { enterModuleScope, leaveModuleScope } from '../../../../../tests/mocks/moduleScope';

let ThreadList: (typeof import('./ThreadList'))['default'];

const fakeRoom = createFakeRoom({ t: 'c' });

describe('ThreadList Component', () => {
	before(() => {
		enterModuleScope();
		mock.module('./components/ThreadListItem', { exports: { default: (() => <></>)() } });
		mock.module('../../contexts/RoomContext', {
			exports: {
				useRoom: () => fakeRoom,
				useRoomSubscription: () => fakeRoom,
			},
		});
		mock.module('../../../../../app/utils/lib/i18n', {
			exports: {
				t: (key: string) => key,
			},
		});
		({ default: ThreadList } = require('./ThreadList'));
	});

	after(leaveModuleScope);
	it('should display an error message when in error state', async () => {
		render(<ThreadList />, {
			wrapper: mockAppRoot()
				.withRoom(fakeRoom)
				.withEndpoint(
					'GET',
					'/v1/chat.getThreadsList',
					fn<FunctionLike>().mockRejectedValue({ success: false, error: 'error-not-allowed', errorType: 'error-not-allowed' }),
				)
				.wrap((children) => (
					<VirtuosoMockContext.Provider value={{ viewportHeight: 300, itemHeight: 100 }}>{children}</VirtuosoMockContext.Provider>
				))
				.build(),
		});
		expect(await screen.findByText('error-not-allowed')).toBeInTheDocument();
	});
});
