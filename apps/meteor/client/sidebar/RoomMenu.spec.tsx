import type { RoomType } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { QueryClient } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';

import RoomMenu from './RoomMenu';
import { createFakeLicenseInfo, createFakeSubscription } from '../../tests/mocks/data';

jest.mock('../../client/lib/rooms/roomCoordinator', () => ({
	roomCoordinator: {
		getRoomDirectives: () => ({
			getUiText: () => 'leaveWarning',
		}),
	},
}));

jest.mock('../../client/lib/LegacyRoomManager', () => ({
	LegacyRoomManager: {
		close: jest.fn(),
	},
}));

jest.mock('./categories/hooks/useCategoryModals', () => ({
	useCategoryModals: () => ({ openCreate: jest.fn(), openManage: jest.fn(), openDelete: jest.fn() }),
}));

const defaultProps = {
	rid: 'roomId',
	type: 'c' as RoomType,
	hideDefaultOptions: false,
	placement: 'right-start',
};

const buildBase = () =>
	mockAppRoot()
		.withTranslations('en', 'core', {
			Archive: 'Archive',
			Notifications: 'Notifications',
			Hide: 'Hide',
			Archive_room: 'Archive room',
			Archive_Channel_Description: '“{{roomName}}” moves to the Archived group.',
			Unarchive: 'Unarchive',
			Turn_OFF: 'Turn off',
			Turn_ON: 'Turn on',
			Mark_unread: 'Mark Unread',
			Favorite: 'Favorite',
			Favorites: 'Favorites',
			Move_to: 'Move to',
			New_category: 'New category',
			Leave_room: 'Leave',
			Remove_from__categoryName__: 'Remove from {{categoryName}}',
		})
		.withSetting('Favorite_Rooms', true)
		.withPermission('leave-c')
		.withPermission('leave-p');

const renderOptions = {
	wrapper: buildBase().build(),
};

const buildEnterpriseQueryClient = () => {
	const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
	client.setQueryData(['licenses', 'getLicenses', undefined], {
		license: createFakeLicenseInfo({ hasValidLicense: true }),
	});
	return client;
};

const enterpriseRenderOptions = {
	wrapper: buildBase().withJohnDoe().withQueryClient(buildEnterpriseQueryClient()).build(),
};

it('should display Hide, Mark Unread, Leave and Favorite toggle for regular rooms without enterprise', async () => {
	render(<RoomMenu {...defaultProps} />, renderOptions);

	await userEvent.click(screen.queryByRole('button') as HTMLElement);

	expect(await screen.findByRole('menuitem', { name: 'Hide' })).toBeInTheDocument();
	expect(await screen.findByRole('menuitem', { name: 'Mark Unread' })).toBeInTheDocument();
	expect(await screen.findByRole('menuitem', { name: 'Leave' })).toBeInTheDocument();
	expect(await screen.findByRole('menuitem', { name: 'Favorite' })).toBeInTheDocument();
	expect(screen.queryByRole('menuitem', { name: 'Move to' })).not.toBeInTheDocument();
});

it('should display Archive, Mark Unread, Leave and Move to for regular rooms with enterprise', async () => {
	render(<RoomMenu {...defaultProps} />, enterpriseRenderOptions);

	await userEvent.click(screen.queryByRole('button') as HTMLElement);

	expect(await screen.findByRole('menuitem', { name: 'Archive' })).toBeInTheDocument();
	expect(await screen.findByRole('menuitem', { name: 'Mark Unread' })).toBeInTheDocument();
	expect(await screen.findByRole('menuitem', { name: 'Leave' })).toBeInTheDocument();
	expect(await screen.findByRole('menuitem', { name: 'Move to' })).toBeInTheDocument();
	expect(screen.queryByRole('menuitem', { name: 'Favorite' })).not.toBeInTheDocument();
});

it('should reveal Favorites and New category inside the "Move to" submenu for enterprise rooms', async () => {
	render(<RoomMenu {...defaultProps} />, enterpriseRenderOptions);

	await userEvent.click(screen.queryByRole('button') as HTMLElement);
	await userEvent.hover(await screen.findByRole('menuitem', { name: 'Move to' }));

	expect(await screen.findByRole('menuitem', { name: 'Favorites' })).toBeInTheDocument();
	expect(await screen.findByRole('menuitem', { name: 'New category' })).toBeInTheDocument();
});

const enterpriseFavoriteRenderOptions = {
	wrapper: buildBase()
		.withJohnDoe()
		.withQueryClient(buildEnterpriseQueryClient())
		.withSubscription(createFakeSubscription({ rid: 'roomId', f: true, t: 'c' }))
		.build(),
};

const enterpriseCategoryRenderOptions = {
	wrapper: buildBase()
		.withJohnDoe()
		.withQueryClient(buildEnterpriseQueryClient())
		.withSubscription(createFakeSubscription({ rid: 'roomId', f: false, t: 'c', category: 'cat-design' }))
		.withUserPreference('sidebarCategories', [{ _id: 'cat-design', name: 'Design', showUnreads: true }])
		.build(),
};

it('shows "Remove from Favorites" in the Move to submenu when the room is in favorites', async () => {
	render(<RoomMenu {...defaultProps} />, enterpriseFavoriteRenderOptions);

	await userEvent.click(screen.queryByRole('button') as HTMLElement);
	await userEvent.hover(await screen.findByRole('menuitem', { name: 'Move to' }));

	expect(await screen.findByRole('menuitem', { name: 'Remove from Favorites' })).toBeInTheDocument();
});

it('shows "Remove from Design" in the Move to submenu when the room is in a custom category', async () => {
	render(<RoomMenu {...defaultProps} />, enterpriseCategoryRenderOptions);

	await userEvent.click(screen.queryByRole('button') as HTMLElement);
	await userEvent.hover(await screen.findByRole('menuitem', { name: 'Move to' }));

	expect(await screen.findByRole('menuitem', { name: 'Remove from Design' })).toBeInTheDocument();
});

it('should display only mark unread and favorite for omnichannel rooms', async () => {
	render(<RoomMenu {...defaultProps} type='l' />, renderOptions);

	const menu = screen.queryByRole('button');
	await userEvent.click(menu as HTMLElement);

	expect(await screen.findAllByRole('menuitem')).toHaveLength(2);
	expect(screen.queryByRole('menuitem', { name: 'Archive' })).not.toBeInTheDocument();
	expect(screen.queryByRole('menuitem', { name: 'Leave' })).not.toBeInTheDocument();
});

describe('the archive', () => {
	// PREVIEW ONLY: the archived rooms live in localStorage here, see useArchivedRooms.
	const ARCHIVED_KEY = 'fuselage-localStorage-sidebarArchivedRooms-john.doe';

	beforeEach(() => {
		localStorage.clear();
	});

	const renderWith = () =>
		render(<RoomMenu {...defaultProps} name='general' />, {
			wrapper: buildBase()
				.withJohnDoe()
				.withQueryClient(buildEnterpriseQueryClient())
				.withSubscription(createFakeSubscription({ rid: 'roomId', t: 'c' }))
				.build(),
		});

	it('archives the room from its menu once the user confirms what that means', async () => {
		renderWith();

		await userEvent.click(screen.getByRole('button', { name: 'Options' }));
		await userEvent.click(await screen.findByRole('menuitem', { name: 'Archive' }));

		const dialog = await screen.findByRole('dialog', { name: 'Archive room' });
		expect(dialog).toHaveTextContent('“general” moves to the Archived group.');
		expect(JSON.parse(localStorage.getItem(ARCHIVED_KEY) ?? '[]')).toEqual([]);

		await userEvent.click(screen.getByRole('button', { name: 'Archive' }));

		await waitFor(() => expect(JSON.parse(localStorage.getItem(ARCHIVED_KEY) ?? '[]')).toEqual(['roomId']));
	});

	it('offers to unarchive an archived room instead', async () => {
		localStorage.setItem(ARCHIVED_KEY, JSON.stringify(['other', 'roomId']));
		renderWith();

		await userEvent.click(screen.getByRole('button', { name: 'Options' }));

		expect(screen.queryByRole('menuitem', { name: 'Archive' })).not.toBeInTheDocument();
		await userEvent.click(await screen.findByRole('menuitem', { name: 'Unarchive' }));

		await waitFor(() => expect(JSON.parse(localStorage.getItem(ARCHIVED_KEY) ?? '[]')).toEqual(['other']));
	});
});

describe('the Notifications toggle', () => {
	const saveNotification = jest.fn(async () => ({ success: true }));

	beforeEach(() => {
		saveNotification.mockClear();
	});

	const renderWith = (disableNotifications: boolean, enterprise = false) => {
		const base = buildBase()
			.withSubscription(createFakeSubscription({ rid: 'roomId', t: 'c', disableNotifications }))
			.withEndpoint('POST', '/v1/rooms.saveNotification', saveNotification as any);
		render(<RoomMenu {...defaultProps} name='general' />, {
			wrapper: enterprise ? base.withJohnDoe().withQueryClient(buildEnterpriseQueryClient()).build() : base.build(),
		});
	};

	it('is on while the room sends notifications, and turns them off', async () => {
		renderWith(false);

		await userEvent.click(screen.getByRole('button', { name: 'Options' }));
		const item = await screen.findByRole('menuitem', { name: 'Turn off' });
		expect(screen.getByRole('group', { name: 'Notifications' })).toContainElement(item);
		// The switch only pictures the state the label already tells: out of the accessibility tree and the tab order.
		const toggle = within(item).getByRole('checkbox', { hidden: true });
		expect(toggle).toBeChecked();
		expect(toggle).toHaveAttribute('aria-hidden', 'true');
		expect(toggle).toHaveAttribute('tabindex', '-1');
		expect(
			await axe(screen.getByRole('menu'), {
				rules: {
					// Fuselage renders every menu item as a `<label role="menuitem">`, which axe rejects; not this menu's doing.
					'aria-allowed-role': { enabled: false },
					// A menu portaled into a bare test document sits in no landmark.
					'region': { enabled: false },
				},
			}),
		).toHaveNoViolations();

		await userEvent.click(item);

		expect(saveNotification).toHaveBeenCalledWith({ roomId: 'roomId', notifications: { disableNotifications: '1' } });
	});

	it('is off while they are off, and turns them on', async () => {
		renderWith(true);

		await userEvent.click(screen.getByRole('button', { name: 'Options' }));
		const item = await screen.findByRole('menuitem', { name: 'Turn on' });
		expect(within(item).getByRole('checkbox', { hidden: true })).not.toBeChecked();

		await userEvent.click(item);

		expect(saveNotification).toHaveBeenCalledWith({ roomId: 'roomId', notifications: { disableNotifications: '0' } });
	});

	it('is there on the licensed menu too', async () => {
		renderWith(false, true);

		await userEvent.click(screen.getByRole('button', { name: 'Options' }));
		await userEvent.click(await screen.findByRole('menuitem', { name: 'Turn off' }));

		expect(saveNotification).toHaveBeenCalledWith({ roomId: 'roomId', notifications: { disableNotifications: '1' } });
	});
});
