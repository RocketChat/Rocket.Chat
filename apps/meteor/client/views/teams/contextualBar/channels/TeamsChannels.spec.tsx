/* eslint-disable testing-library/no-container */
/* eslint-disable testing-library/no-node-access */
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, waitFor } from '@testing-library/react';

import TeamsChannels from './TeamsChannels';
import { createFakeRoom } from '../../../../../tests/mocks/data';

jest.mock('../../../../lib/rooms/roomCoordinator', () => ({
	roomCoordinator: {
		getRouteLink: () => undefined,
	},
}));

const mainRoom = createFakeRoom({ name: 'Main Room' });
const fakeRooms = Array.from({ length: 10 }, (_, index) => createFakeRoom({ t: 'c', name: `Fake Room ${index}` }));

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
