import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
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

const openArchiveRooms = jest.fn();

jest.mock('./hooks/useCategoryModals', () => ({
	useCategoryModals: () => ({ openManage: jest.fn(), openDelete: jest.fn(), openArchiveRooms }),
}));

jest.mock('./hooks/useMoveRoomCategory', () => ({
	useMoveRoomCategory: () => ({ mutateAsync: jest.fn() }),
}));

jest.mock('../../navbar/NavBarPagesGroup/hooks/useCreateNewItems', () => ({
	useCreateNewItems: () => [],
}));

const mutate = jest.fn();

const readMessages = jest.fn(async () => undefined);

const appRoot = mockAppRoot()
	.withEndpoint('POST', '/v1/subscriptions.read', readMessages as any)
	.withTranslations('en', 'core', {
		Options: 'Options',
		Filter: 'Filter',
		All: 'All',
		Last_24_hours: 'Last 24 hours',
		Last_7_days: 'Last 7 days',
		Last_14_days: 'Last 14 days',
		Last_30_days: 'Last 30 days',
		Hide_inactive_unreads: 'Hide inactive unreads',
		Archive_rooms_ellipsis: 'Archive rooms…',
		Unreads: 'Unreads',
		Mark_read: 'Mark read',
		Mark_rooms_as_read: 'Mark rooms as read',
		Unread_rooms_in_group_become_read_one: '{{count}} unread room in “{{group}}” becomes read, threads included.',
		Unread_rooms_in_group_become_read_other: '{{count}} unread rooms in “{{group}}” become read, threads included.',
		Rooms_marked_read_one: '{{count}} room marked read',
		Rooms_marked_read_other: '{{count}} rooms marked read',
		Cancel: 'Cancel',
		Always_display: 'Always display',
		Keep_on_top: 'Keep on top',
		Move_up: 'Move up',
		Move_down: 'Move down',
	})
	.build();

beforeEach(() => {
	localStorage.clear();
	mutate.mockClear();
	readMessages.mockClear();
	openArchiveRooms.mockClear();
	jest.mocked(usePersistCategoriesMutation).mockReturnValue({ mutate } as any);
	jest.mocked(useUserSidebarCategories).mockReturnValue({
		rawCategories: [{ _id: 'Channels', name: 'Channels', default: true, activityFilterHours: 24 * 7 }],
		customCategories: [],
	});
});

const rooms = [{ rid: 'general', t: 'c', name: 'general' }] as SubscriptionWithRoom[];

const renderMenu = (overrides: Partial<ComponentProps<typeof CategoryMenu>> = {}) =>
	render(
		<CategoryMenu
			groupKey='Channels'
			groupTitle='Channels'
			rooms={rooms}
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

// UI-PREVIEW ONLY: the toggle lives in localStorage, under the key fuselage-hooks derives (no user in this app root).
const HIDES_UNREADS_KEY = 'fuselage-localStorage-sidebarActivityFilterHidesUnreads-anonymous';
const storedHidesUnreads = () => JSON.parse(localStorage.getItem(HIDES_UNREADS_KEY) ?? 'null');

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

		// UI-PREVIEW ONLY: the window lives in localStorage, keyed by group, in place of the preference.
		expect(JSON.parse(localStorage.getItem('fuselage-localStorage-sidebarActivityFilters-anonymous') ?? 'null')).toEqual({
			Channels: 24 * 14,
		});
		expect(onActivityFilterChange).toHaveBeenCalledWith(24 * 14);
	});

	it('turns the unreads toggle on for the group', async () => {
		const toggle = await openFilterSubmenu();

		await userEvent.click(toggle);

		expect(storedHidesUnreads()).toEqual({ Channels: true });
		expect(mutate).not.toHaveBeenCalled();
	});

	it('turns the unreads toggle off again', async () => {
		jest.mocked(useUserSidebarCategories).mockReturnValue({
			rawCategories: [{ _id: 'Channels', name: 'Channels', default: true, activityFilterHours: 24 * 7, activityFilterHidesUnreads: true }],
			customCategories: [],
		});
		const toggle = await openFilterSubmenu({ activityFilterHidesUnreads: true });
		expect(toggle).toHaveAttribute('aria-checked', 'true');

		await userEvent.click(toggle);

		expect(storedHidesUnreads()).toEqual({});
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

		expect(storedHidesUnreads()).toBeNull();
	});
});

describe('the archive item', () => {
	it('opens the modal that archives the inactive rooms of the group', async () => {
		renderMenu();
		await userEvent.click(await screen.findByRole('button', { name: 'Options' }));

		await userEvent.click(await screen.findByRole('menuitemcheckbox', { name: 'Archive rooms…' }));

		expect(openArchiveRooms).toHaveBeenCalledWith({ groupTitle: 'Channels', rooms });
	});

	it('is not offered on a dynamic group', async () => {
		renderMenu({ groupKey: 'Unread', groupTitle: 'Unread' });
		await userEvent.click(await screen.findByRole('button', { name: 'Options' }));

		expect(await screen.findByRole('menuitemcheckbox', { name: 'Move up' })).toBeInTheDocument();
		expect(screen.queryByRole('menuitemcheckbox', { name: 'Archive rooms…' })).not.toBeInTheDocument();
	});
});

describe('the Mark read item', () => {
	const unreadRooms = [
		{ rid: 'read-one', t: 'c', name: 'read-one', unread: 0, alert: false },
		{ rid: 'unread-one', t: 'c', name: 'unread-one', unread: 2, alert: true },
		{ rid: 'thread-one', t: 'p', name: 'thread-one', unread: 0, alert: false, tunread: ['m1'] },
	] as SubscriptionWithRoom[];

	it('is disabled while the group has nothing unread', async () => {
		renderMenu({ rooms: [rooms[0]] });
		await userEvent.click(await screen.findByRole('button', { name: 'Options' }));

		const item = await screen.findByRole('menuitemcheckbox', { name: 'Mark read' });
		expect(item).toHaveAttribute('aria-disabled', 'true');

		await userEvent.click(item);

		expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
	});

	it('says how many rooms become read, then marks each unread one read with its threads', async () => {
		renderMenu({ rooms: unreadRooms });
		await userEvent.click(await screen.findByRole('button', { name: 'Options' }));
		await userEvent.click(await screen.findByRole('menuitemcheckbox', { name: 'Mark read' }));

		const dialog = await screen.findByRole('dialog', { name: 'Mark rooms as read' });
		expect(dialog).toHaveTextContent('2 unread rooms in “Channels” become read, threads included.');
		expect(readMessages).not.toHaveBeenCalled();

		await userEvent.click(screen.getByRole('button', { name: 'Mark read' }));

		await waitFor(() => expect(readMessages).toHaveBeenCalledTimes(2));
		expect(readMessages).toHaveBeenCalledWith({ rid: 'unread-one', readThreads: true });
		expect(readMessages).toHaveBeenCalledWith({ rid: 'thread-one', readThreads: true });
		await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
	});

	it('keeps the modal up with a busy button until every room is read, and takes no second run meanwhile', async () => {
		let finish: () => void = () => undefined;
		readMessages.mockImplementation(
			() =>
				new Promise<undefined>((resolve) => {
					finish = () => resolve(undefined);
				}),
		);

		renderMenu({ rooms: unreadRooms });
		await userEvent.click(await screen.findByRole('button', { name: 'Options' }));
		await userEvent.click(await screen.findByRole('menuitemcheckbox', { name: 'Mark read' }));
		const dialog = await screen.findByRole('dialog', { name: 'Mark rooms as read' });
		expect(await axe(dialog)).toHaveNoViolations();

		await userEvent.click(screen.getByRole('button', { name: 'Mark read' }));

		expect(screen.getByRole('dialog', { name: 'Mark rooms as read' })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Mark read' })).toBeDisabled();
		await userEvent.click(await screen.findByRole('button', { name: 'Options' }));
		expect(await screen.findByRole('menuitemcheckbox', { name: 'Mark read' })).toHaveAttribute('aria-disabled', 'true');

		finish();
		await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
		readMessages.mockImplementation(async () => undefined);
	});
});
