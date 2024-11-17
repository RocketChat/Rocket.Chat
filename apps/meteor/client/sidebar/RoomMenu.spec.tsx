import type { RoomType } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import React from 'react';

import RoomMenu from './RoomMenu';

jest.mock('../../client/lib/rooms/roomCoordinator', () => ({
	roomCoordinator: {
		getRoomDirectives: () => ({
			getUiText: () => 'leaveWarning',
		}),
	},
}));

jest.mock('../../app/ui-utils/client', () => ({
	LegacyRoomManager: {
		close: jest.fn(),
	},
}));

const defaultProps = {
	rid: 'roomId',
	type: 'c' as RoomType,
	hideDefaultOptions: false,
	placement: 'right-start',
};

const renderOptions = {
	wrapper: mockAppRoot()
		.withTranslations('en', 'core', {
			Hide: 'Hide',
			Mark_unread: 'Mark Unread',
			Favorite: 'Favorite',
			Leave_room: 'Leave',
		})
		.withSetting('Favorite_Rooms', true)
		.withPermission('leave-c')
		.withPermission('leave-p')
		.build(),
	legacyRoot: true,
};

it('should display all the menu options for regular rooms', async () => {
	render(<RoomMenu {...defaultProps} />, renderOptions);

	const menu = screen.queryByRole('button');
	await userEvent.click(menu as HTMLElement);

	expect(await screen.findByRole('option', { name: 'Hide' })).toBeInTheDocument();
	expect(await screen.findByRole('option', { name: 'Favorite' })).toBeInTheDocument();
	expect(await screen.findByRole('option', { name: 'Mark Unread' })).toBeInTheDocument();
	expect(await screen.findByRole('option', { name: 'Leave' })).toBeInTheDocument();
});

it('should display only mark unread and favorite for omnichannel rooms', async () => {
	render(<RoomMenu {...defaultProps} type='l' />, renderOptions);

	const menu = screen.queryByRole('button');
	await userEvent.click(menu as HTMLElement);

	expect(await screen.findAllByRole('option')).toHaveLength(2);
	expect(screen.queryByRole('option', { name: 'Hide' })).not.toBeInTheDocument();
	expect(screen.queryByRole('option', { name: 'Leave' })).not.toBeInTheDocument();
});
