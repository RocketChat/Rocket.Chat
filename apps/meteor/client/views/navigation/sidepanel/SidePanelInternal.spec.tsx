import { render } from '@testing-library/react';

import SidePanelInternal from './SidePanelInternal';

const mockVirtuoso = jest.fn();

jest.mock('react-virtuoso', () => ({
	Virtuoso: (props: any) => {
		mockVirtuoso(props);
		return null;
	},
}));

jest.mock('react-i18next', () => ({
	useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('@rocket.chat/ui-contexts', () => ({
	useLayout: () => ({
		isTablet: false,
		sidePanel: { closeSidePanel: jest.fn() },
	}),
}));

jest.mock('../contexts/RoomsNavigationContext', () => ({
	useIsRoomFilter: () => false,
}));

jest.mock('../sidebar/hooks/usePreventDefault', () => ({
	usePreventDefault: () => jest.fn(),
}));

jest.mock('../../../lib/RoomManager', () => ({
	useOpenedRoom: () => 'GENERAL',
}));

describe('SidePanelInternal', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('passes computeItemKey to Virtuoso keying items by _id or rid', () => {
		const rooms = [
			{ _id: 'sub-1', rid: 'room-1' },
			{ rid: 'room-2' },
		];

		render(
			<SidePanelInternal
				title='Test'
				currentTab='all'
				unreadOnly={false}
				toggleUnreadOnly={jest.fn()}
				rooms={rooms}
				ItemContentComponent={() => null}
			/>,
		);

		expect(mockVirtuoso).toHaveBeenCalled();
		const { computeItemKey } = mockVirtuoso.mock.calls[0][0];

		expect(computeItemKey(0, rooms[0])).toBe('sub-1');
		expect(computeItemKey(1, rooms[1])).toBe('room-2');
		expect(computeItemKey(2, {})).toBe(2);
	});
});
