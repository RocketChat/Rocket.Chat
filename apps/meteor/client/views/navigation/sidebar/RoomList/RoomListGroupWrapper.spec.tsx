import { SidebarCollapseGroup } from '@rocket.chat/fuselage';
import { render, screen, within } from '@testing-library/react';

import RoomListGroupWrapper from './RoomListGroupWrapper';
import RoomListWrapper from './RoomListWrapper';

jest.mock('react-i18next', () => ({
	useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('./useSidebarListNavigation', () => ({
	useSidebarListNavigation: () => ({
		sidebarListRef: { current: null },
	}),
}));

describe('RoomListGroupWrapper', () => {
	it('renders as a listitem', () => {
		render(
			<RoomListGroupWrapper data-testid='group-wrapper'>
				<div>Favorites</div>
			</RoomListGroupWrapper>,
		);

		expect(screen.getByTestId('group-wrapper')).toHaveRole('listitem');
		expect(screen.getByText('Favorites')).toBeInTheDocument();
	});

	it('keeps the collapse group from being an owned child of the sidebar list', () => {
		render(
			<RoomListWrapper>
				<RoomListGroupWrapper>
					<SidebarCollapseGroup title='Favorites' aria-label='Collapse Favorites' />
				</RoomListGroupWrapper>
			</RoomListWrapper>,
		);

		const list = screen.getByRole('list', { name: 'Channels' });
		const [listItem] = within(list).getAllByRole('listitem');
		const group = within(list).getByRole('group', { name: 'Collapse Favorites' });

		expect(within(listItem).getByRole('group', { name: 'Collapse Favorites' })).toBe(group);
	});
});
