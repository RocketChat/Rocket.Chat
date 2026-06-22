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
	it('uses the legacy Virtuoso item list test id by default', () => {
		render(
			<RoomListWrapper style={{ height: '100%' }}>
				<div>general</div>
			</RoomListWrapper>,
		);

		expect(screen.getByTestId('virtuoso-item-list')).toHaveRole('list');
		expect(screen.getByTestId('virtuoso-item-list')).toHaveAttribute('aria-label', 'Channels');
	});

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
