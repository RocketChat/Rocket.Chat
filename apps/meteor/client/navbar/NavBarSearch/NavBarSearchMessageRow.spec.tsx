import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';

import NavBarSearchMessageRow from './NavBarSearchMessageRow';

import '@testing-library/jest-dom';

jest.mock('../../lib/rooms/roomCoordinator', () => ({
	roomCoordinator: {
		getRouteLink: jest.fn(() => '/direct/alice_test'),
	},
}));

describe('NavBarSearchMessageRow', () => {
	it('uses the username for a direct message room when UI_Use_Real_Name is disabled', () => {
		const appWrapper = mockAppRoot().withSetting('UI_Use_Real_Name', false).build();

		render(
			<NavBarSearchMessageRow
				item={{
					_id: 'result-1',
					rid: 'dm-room',
					msgId: 'message-1',
					text: 'zebra quantum pineapple 8472',
					room: {
						_id: 'dm-room',
						t: 'd',
						name: 'alice_test',
						fname: 'Alice Wonderland',
					},
				}}
				onClick={jest.fn()}
			/>,
			{ wrapper: appWrapper },
		);

		expect(screen.getByText('alice_test')).toBeInTheDocument();
		expect(screen.queryByText('Alice Wonderland')).not.toBeInTheDocument();
	});

	it('uses the real name for a direct message room when UI_Use_Real_Name is enabled', () => {
		const appWrapper = mockAppRoot().withSetting('UI_Use_Real_Name', true).build();

		render(
			<NavBarSearchMessageRow
				item={{
					_id: 'result-1',
					rid: 'dm-room',
					msgId: 'message-1',
					text: 'zebra quantum pineapple 8472',
					room: {
						_id: 'dm-room',
						t: 'd',
						name: 'alice_test',
						fname: 'Alice Wonderland',
					},
				}}
				onClick={jest.fn()}
			/>,
			{ wrapper: appWrapper },
		);

		expect(screen.getByText('Alice Wonderland')).toBeInTheDocument();
		expect(screen.queryByText('alice_test')).not.toBeInTheDocument();
	});
});
