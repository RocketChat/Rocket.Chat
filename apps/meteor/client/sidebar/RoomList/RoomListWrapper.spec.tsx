import { render, screen } from '@testing-library/react';

import RoomListWrapper from './RoomListWrapper';

jest.mock('react-i18next', () => ({
	useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('./useSidebarListNavigation', () => ({
	useSidebarListNavigation: () => ({
		sidebarListRef: { current: null },
	}),
}));

describe('RoomListWrapper', () => {
	it('forwards Virtua container props', () => {
		render(
			<RoomListWrapper data-testid='room-list-wrapper' style={{ height: '100%' }}>
				<div>general</div>
			</RoomListWrapper>,
		);

		expect(screen.getByRole('list', { name: 'Channels' })).toBeInTheDocument();
		expect(screen.getByTestId('room-list-wrapper')).toHaveStyle({ height: '100%' });
		expect(screen.getByText('general')).toBeInTheDocument();
	});
});
