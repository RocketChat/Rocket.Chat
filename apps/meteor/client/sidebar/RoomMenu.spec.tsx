import type { RoomType } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { QueryClient } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';

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
			Hide: 'Hide',
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
		license: createFakeLicenseInfo({ hasValidLicense: true, activeModules: ['experimental-enterprise-features'] }),
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

it('should display Hide, Mark Unread, Leave and Move to for regular rooms with enterprise', async () => {
	render(<RoomMenu {...defaultProps} />, enterpriseRenderOptions);

	await userEvent.click(screen.queryByRole('button') as HTMLElement);

	expect(await screen.findByRole('menuitem', { name: 'Hide' })).toBeInTheDocument();
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
	expect(screen.queryByRole('menuitem', { name: 'Hide' })).not.toBeInTheDocument();
	expect(screen.queryByRole('menuitem', { name: 'Leave' })).not.toBeInTheDocument();
});
