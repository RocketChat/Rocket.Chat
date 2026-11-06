import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';

import CategoryMenu from './CategoryMenu';
import { usePersistCategoriesMutation } from './hooks/usePersistCategoriesMutation';
import { useUserSidebarCategories } from './hooks/useUserSidebarCategories';

jest.mock('@rocket.chat/ui-client', () => ({
	...jest.requireActual('@rocket.chat/ui-client'),
	useIsEnterprise: () => ({ data: { isEnterprise: true } }),
}));

jest.mock('./hooks/usePersistCategoriesMutation', () => ({
	usePersistCategoriesMutation: jest.fn(),
}));

jest.mock('./hooks/useUserSidebarCategories', () => ({
	useUserSidebarCategories: jest.fn(),
}));

jest.mock('./hooks/useCategoryModals', () => ({
	useCategoryModals: () => ({ openManage: jest.fn(), openDelete: jest.fn() }),
}));

jest.mock('./hooks/useMoveRoomCategory', () => ({
	useMoveRoomCategory: () => ({ mutateAsync: jest.fn() }),
}));

jest.mock('../../navbar/NavBarPagesGroup/hooks/useCreateNewItems', () => ({
	useCreateNewItems: () => [],
}));

const mutate = jest.fn();

const appRoot = mockAppRoot()
	.withTranslations('en', 'core', {
		Options: 'Options',
		Filter: 'Filter',
		All: 'All',
		Last_24_hours: 'Last 24 hours',
		Last_7_days: 'Last 7 days',
		Last_14_days: 'Last 14 days',
		Last_30_days: 'Last 30 days',
		Hide_inactive_unreads: 'Hide inactive unreads',
		Unreads: 'Unreads',
		Always_display: 'Always display',
		Keep_on_top: 'Keep on top',
		Move_up: 'Move up',
		Move_down: 'Move down',
	})
	.build();

beforeEach(() => {
	mutate.mockClear();
	jest.mocked(usePersistCategoriesMutation).mockReturnValue({ mutate } as any);
	jest.mocked(useUserSidebarCategories).mockReturnValue({
		rawCategories: [{ _id: 'Channels', name: 'Channels', default: true, activityFilterHours: 24 * 7 }],
		customCategories: [],
	});
});

const renderMenu = (overrides: Partial<ComponentProps<typeof CategoryMenu>> = {}) =>
	render(
		<CategoryMenu
			groupKey='Channels'
			showUnreads={false}
			keepUnreadsOnTop={false}
			activityFilterHours={24 * 7}
			canMoveUp
			canMoveDown
			onMoveUp={jest.fn()}
			onMoveDown={jest.fn()}
			onActivityFilterChange={jest.fn()}
			{...overrides}
		/>,
		{ wrapper: appRoot },
	);

const openFilterSubmenu = async (overrides: Partial<ComponentProps<typeof CategoryMenu>> = {}) => {
	renderMenu(overrides);
	await userEvent.click(await screen.findByRole('button', { name: 'Options' }));
	await userEvent.click(await screen.findByRole('menuitem', { name: 'Filter' }));
	return screen.findByRole('menuitemcheckbox', { name: /Hide inactive unreads/ });
};

const persistedChannels = () => mutate.mock.calls[0][0].find((entry: { _id: string }) => entry._id === 'Channels');

describe('the Filter submenu', () => {
	it('checks the window in use and offers the unreads toggle, off by default', async () => {
		const toggle = await openFilterSubmenu();

		expect(screen.getByRole('menuitemcheckbox', { name: 'Last 7 days' })).toHaveAttribute('aria-checked', 'true');
		expect(screen.getByRole('menuitemcheckbox', { name: 'All' })).toHaveAttribute('aria-checked', 'false');
		expect(toggle).toHaveAttribute('aria-checked', 'false');
		expect(toggle).not.toHaveAttribute('aria-disabled');
	});

	it('offers the windows from the shortest to the longest', async () => {
		await openFilterSubmenu();

		const windows = ['All', 'Last 24 hours', 'Last 7 days', 'Last 14 days', 'Last 30 days'];
		// The checked window also renders its checkmark, so the names are matched rather than compared whole.
		const offered = screen
			.getAllByRole('menuitemcheckbox')
			.map((item) => windows.find((name) => item.textContent?.includes(name)))
			.filter((name): name is string => !!name);
		expect(offered).toEqual(windows);
	});

	it('persists the window chosen and reports it, for the announcement', async () => {
		const onActivityFilterChange = jest.fn();
		await openFilterSubmenu({ onActivityFilterChange });

		await userEvent.click(screen.getByRole('menuitemcheckbox', { name: 'Last 14 days' }));

		expect(persistedChannels()).toEqual(expect.objectContaining({ activityFilterHours: 24 * 14 }));
		expect(onActivityFilterChange).toHaveBeenCalledWith(24 * 14);
	});

	it('turns the unreads toggle on for the group', async () => {
		const toggle = await openFilterSubmenu();

		await userEvent.click(toggle);

		expect(persistedChannels()).toEqual(expect.objectContaining({ activityFilterHours: 24 * 7, activityFilterHidesUnreads: true }));
	});

	it('turns the unreads toggle off again', async () => {
		jest.mocked(useUserSidebarCategories).mockReturnValue({
			rawCategories: [{ _id: 'Channels', name: 'Channels', default: true, activityFilterHours: 24 * 7, activityFilterHidesUnreads: true }],
			customCategories: [],
		});
		const toggle = await openFilterSubmenu({ activityFilterHidesUnreads: true });
		expect(toggle).toHaveAttribute('aria-checked', 'true');

		await userEvent.click(toggle);

		expect(persistedChannels()).toEqual(expect.objectContaining({ activityFilterHidesUnreads: false }));
	});

	it('disables the unreads toggle while the group has no window', async () => {
		jest.mocked(useUserSidebarCategories).mockReturnValue({
			rawCategories: [{ _id: 'Channels', name: 'Channels', default: true, activityFilterHidesUnreads: true }],
			customCategories: [],
		});
		const toggle = await openFilterSubmenu({ activityFilterHours: undefined, activityFilterHidesUnreads: true });

		expect(screen.getByRole('menuitemcheckbox', { name: 'All' })).toHaveAttribute('aria-checked', 'true');
		expect(toggle).toHaveAttribute('aria-disabled', 'true');
		expect(toggle).toHaveAttribute('aria-checked', 'true');

		await userEvent.click(toggle);

		expect(mutate).not.toHaveBeenCalled();
	});
});
