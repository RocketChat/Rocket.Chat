import type { ISidebarCategory } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { useIsEnterprise } from '@rocket.chat/ui-client';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';

import DisplayMenu from './DisplayMenu';
import { usePersistCategoriesMutation } from '../../sidebar/categories/hooks/usePersistCategoriesMutation';
import { useUserSidebarCategories } from '../../sidebar/categories/hooks/useUserSidebarCategories';

jest.mock('@rocket.chat/ui-client', () => ({
	...jest.requireActual('@rocket.chat/ui-client'),
	useIsEnterprise: jest.fn(),
}));

jest.mock('../../sidebar/categories/hooks/usePersistCategoriesMutation', () => ({
	usePersistCategoriesMutation: jest.fn(),
}));

jest.mock('../../sidebar/categories/hooks/useUserSidebarCategories', () => ({
	useUserSidebarCategories: jest.fn(),
}));

const mutate = jest.fn();

const STATIC_GROUPS = ['Favorites', 'Teams', 'Discussions', 'Channels', 'Direct_Messages', 'Conversations'];

const withCategories = (rawCategories: ISidebarCategory[]) =>
	jest
		.mocked(useUserSidebarCategories)
		.mockReturnValue({ rawCategories, customCategories: rawCategories.filter((entry) => !entry.default) });

const appRoot = (sidebarShowUnread = false) =>
	mockAppRoot()
		.withJohnDoe()
		.withUserPreference('sidebarShowUnread', sidebarShowUnread)
		.withTranslations('en', 'core', {
			Display: 'Display',
			Sort_By: 'Sort by',
			Group_by: 'Group by',
			Activity: 'Activity',
			Name: 'Name',
			Unread: 'Unread',
			Favorites: 'Favorites',
			Types: 'Types',
			All_groups: 'All groups',
			Set_per_group: 'Set per group',
			Filter: 'Filter',
			All: 'All',
			Last_24_hours: 'Last 24 hours',
			Last_7_days: 'Last 7 days',
			Last_14_days: 'Last 14 days',
			Last_30_days: 'Last 30 days',
			Unreads: 'Unreads',
			Always_display: 'Always display',
			Keep_on_top: 'Keep on top',
			Disabled_by_unread_group_see_display_options: 'Disabled by unread group, see display options',
		})
		.build();

beforeEach(() => {
	mutate.mockClear();
	jest.mocked(useIsEnterprise).mockReturnValue({ data: { isEnterprise: true } } as any);
	jest.mocked(usePersistCategoriesMutation).mockReturnValue({ mutate } as any);
	withCategories(STATIC_GROUPS.map((id) => ({ _id: id, name: id, default: true, activityFilterHours: 168 })));
});

const openMenu = async (sidebarShowUnread = false) => {
	render(<DisplayMenu />, { wrapper: appRoot(sidebarShowUnread) });
	await userEvent.click(await screen.findByRole('button', { name: 'Display' }));
	return screen.findByRole('menu');
};

const openAllGroups = async (sidebarShowUnread = false) => {
	await openMenu(sidebarShowUnread);
	await userEvent.click(await screen.findByRole('menuitem', { name: /All groups/ }));
	expect(await screen.findByRole('menuitemcheckbox', { name: 'All' })).toBeInTheDocument();
};

const persisted = (): ISidebarCategory[] => mutate.mock.calls[0][0];

describe('the Display menu', () => {
	it('keeps its sections and offers All groups', async () => {
		const menu = await openMenu();

		// The root menu selects in multiple mode, as it did before this change, so its plain items are checkbox items.
		expect(within(menu).getByRole('menuitemcheckbox', { name: 'Activity' })).toBeInTheDocument();
		expect(within(menu).getByRole('menuitemcheckbox', { name: 'Types' })).toBeInTheDocument();
		expect(within(menu).getByRole('menuitem', { name: 'All groups' })).toBeInTheDocument();
	});

	it('is not offered without the license module', async () => {
		jest.mocked(useIsEnterprise).mockReturnValue({ data: { isEnterprise: false } } as any);

		const menu = await openMenu();

		expect(within(menu).queryByRole('menuitem', { name: /All groups/ })).not.toBeInTheDocument();
	});

	it('checks the window every group shares and the toggles that are on everywhere', async () => {
		withCategories(STATIC_GROUPS.map((id) => ({ _id: id, name: id, default: true, activityFilterHours: 168, keepUnreadsOnTop: true })));

		await openAllGroups();

		expect(screen.getByRole('menuitemcheckbox', { name: 'Last 7 days' })).toHaveAttribute('aria-checked', 'true');
		expect(screen.getByRole('menuitemcheckbox', { name: 'All' })).toHaveAttribute('aria-checked', 'false');
		expect(screen.getByRole('menuitemcheckbox', { name: 'Always display' })).toHaveAttribute('aria-checked', 'false');
		expect(screen.getByRole('menuitemcheckbox', { name: 'Keep on top' })).toHaveAttribute('aria-checked', 'true');
		expect(screen.queryByText('Set per group')).not.toBeInTheDocument();

		// Only the submenu is checked: the root menu's radio and checkbox addons predate this change.
		// `aria-allowed-role` and `region`: Fuselage renders a menu item as a label and the menu as a section.
		const menus = screen.getAllByRole('menu');
		expect(
			await axe(menus[menus.length - 1], { rules: { 'aria-allowed-role': { enabled: false }, 'region': { enabled: false } } }),
		).toHaveNoViolations();
	});

	it('checks nothing for a setting the groups disagree on, and says they are set per group', async () => {
		withCategories([
			{ _id: 'Channels', name: 'Channels', default: true, activityFilterHours: 168 },
			{ _id: 'Teams', name: 'Teams', default: true, activityFilterHours: 24 },
		]);

		await openMenu();
		// The hint is part of the item, so it is part of what the item announces.
		expect(screen.getByRole('menuitem', { name: /All groups.*Set per group/ })).toBeInTheDocument();

		await userEvent.click(screen.getByRole('menuitem', { name: /All groups/ }));
		expect(await screen.findByRole('menuitemcheckbox', { name: 'All' })).toBeInTheDocument();

		for (const name of ['All', 'Last 24 hours', 'Last 7 days', 'Last 14 days', 'Last 30 days']) {
			expect(screen.getByRole('menuitemcheckbox', { name })).toHaveAttribute('aria-checked', 'false');
		}
	});

	it('writes the chosen window to every group', async () => {
		await openAllGroups();

		await userEvent.click(screen.getByRole('menuitemcheckbox', { name: 'Last 30 days' }));

		expect(mutate).toHaveBeenCalledTimes(1);
		for (const id of STATIC_GROUPS) {
			expect(persisted().find((entry) => entry._id === id)?.activityFilterHours).toBe(720);
		}
	});

	it('turns a toggle on for every group when the groups disagree', async () => {
		withCategories([{ _id: 'Channels', name: 'Channels', default: true, showUnreads: true }]);

		await openAllGroups();
		expect(screen.getByRole('menuitemcheckbox', { name: 'Always display' })).toHaveAttribute('aria-checked', 'false');

		await userEvent.click(screen.getByRole('menuitemcheckbox', { name: 'Always display' }));

		for (const id of STATIC_GROUPS) {
			expect(persisted().find((entry) => entry._id === id)?.showUnreads).toBe(true);
		}
	});

	it('disables the unread toggles while the Unread group is on', async () => {
		await openAllGroups(true);

		const alwaysDisplay = screen.getByRole('menuitemcheckbox', { name: 'Always display' });
		expect(alwaysDisplay).toHaveAttribute('aria-disabled', 'true');
		expect(screen.getByRole('menuitemcheckbox', { name: 'Keep on top' })).toHaveAttribute('aria-disabled', 'true');
		expect(screen.getByRole('menuitemcheckbox', { name: 'Last 7 days' })).not.toHaveAttribute('aria-disabled');

		await userEvent.click(alwaysDisplay);

		expect(mutate).not.toHaveBeenCalled();
	});
});
