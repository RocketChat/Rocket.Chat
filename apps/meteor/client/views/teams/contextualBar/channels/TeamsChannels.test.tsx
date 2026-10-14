import { after, before, beforeEach, describe, it, mock } from 'node:test';

/* eslint-disable testing-library/no-node-access */
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, waitFor } from '@testing-library/react';
import { expect } from 'expect'; /* eslint-disable testing-library/no-container */

import { createFakeRoom } from '../../../../../tests/mocks/data';
import { enterModuleScope, leaveModuleScope } from '../../../../../tests/mocks/moduleScope';

let TeamsChannels: (typeof import('./TeamsChannels'))['default'];

const mainRoom = createFakeRoom({ name: 'Main Room' });
const fakeRooms = Array.from({ length: 10 }, (_, index) => createFakeRoom({ t: 'c', name: `Fake Room ${index}` }));

describe('TeamsChannels', () => {
	before(() => {
		enterModuleScope();
		mock.module('../../../../lib/rooms/roomCoordinator', {
			exports: {
				roomCoordinator: {
					getRouteLink: () => undefined,
				},
			},
		});
		({ default: TeamsChannels } = require('./TeamsChannels'));
	});

	after(leaveModuleScope);

	beforeEach(() => {
		Object.defineProperty(window, 'getComputedStyle', {
			value: () => {
				return {
					getPropertyPriority: () => undefined,
					getPropertyValue: () => undefined,
				};
			},
		});
	});

	// TODO: Replace this with the storybook & snapshot
	it('should render scrollbars', async () => {
		const { container } = render(
			<TeamsChannels
				text=''
				type='all'
				reload={() => undefined}
				loadMoreItems={() => undefined}
				setText={() => undefined}
				setType={() => undefined}
				onClickClose={() => undefined}
				onClickAddExisting={() => undefined}
				onClickView={() => undefined}
				onClickCreateNew={() => undefined}
				total={fakeRooms.length}
				loading={false}
				mainRoom={mainRoom}
				channels={fakeRooms}
			/>,
			{
				wrapper: mockAppRoot().build(),
			},
		);

		await waitFor(() => {
			expect(container.querySelector('[data-overlayscrollbars]')).toBeInTheDocument();
		});

		expect(container.querySelector('[data-overlayscrollbars]')).toBeInTheDocument();
	});
});
