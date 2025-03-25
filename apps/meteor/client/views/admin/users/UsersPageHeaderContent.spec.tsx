import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';

import '@testing-library/jest-dom';

import UsersPageHeaderContent from './UsersPageHeaderContent';

it('should not show "Assign Extension" button if voip setting is enabled but user dont have required permission', async () => {
	render(<UsersPageHeaderContent isSeatsCapExceeded={false} seatsCap={{ activeUsers: 1, maxActiveUsers: 1 }} />, {
		wrapper: mockAppRoot().withJohnDoe().withSetting('VoIP_TeamCollab_Enabled', true).build(),
	});

	expect(screen.queryByRole('button', { name: 'Assign_extension' })).not.toBeInTheDocument();
});

it('should not show "Assign Extension" button if user has required permission but voip setting is disabled', async () => {
	render(<UsersPageHeaderContent isSeatsCapExceeded={false} seatsCap={{ activeUsers: 1, maxActiveUsers: 1 }} />, {
		wrapper: mockAppRoot().withJohnDoe().withSetting('VoIP_TeamCollab_Enabled', true).build(),
	});

	expect(screen.queryByRole('button', { name: 'Assign_extension' })).not.toBeInTheDocument();
});

it('should show "Assign Extension" button if user has required permission and voip setting is enabled', async () => {
	render(<UsersPageHeaderContent isSeatsCapExceeded={false} seatsCap={{ activeUsers: 1, maxActiveUsers: 1 }} />, {
		wrapper: mockAppRoot().withJohnDoe().withSetting('VoIP_TeamCollab_Enabled', true).withPermission('manage-voip-extensions').build(),
	});

	expect(screen.getByRole('button', { name: 'Assign_extension' })).toBeInTheDocument();
	expect(screen.getByRole('button', { name: 'Assign_extension' })).toBeEnabled();
});

it('should not render "Associate Extension" button when VoIP_TeamCollab_Enabled setting is disabled', async () => {
	render(<UsersPageHeaderContent isSeatsCapExceeded={false} seatsCap={{ activeUsers: 1, maxActiveUsers: 1 }} />, {
		wrapper: mockAppRoot().withJohnDoe().withSetting('VoIP_TeamCollab_Enabled', false).build(),
	});

	expect(screen.queryByRole('button', { name: 'Assign_extension' })).not.toBeInTheDocument();
});

it('should show "Invite" button if has build-register-user permission', () => {
	render(<UsersPageHeaderContent isSeatsCapExceeded={false} seatsCap={{ activeUsers: 1, maxActiveUsers: 1 }} />, {
		wrapper: mockAppRoot().withJohnDoe().withPermission('bulk-register-user').build(),
	});

	expect(screen.getByRole('button', { name: 'Invite' })).toBeInTheDocument();
});

it('should hide "Invite" button if user doesnt have build-register-user permission', () => {
	render(<UsersPageHeaderContent isSeatsCapExceeded={false} seatsCap={{ activeUsers: 1, maxActiveUsers: 1 }} />, {
		wrapper: mockAppRoot().withJohnDoe().build(),
	});

	expect(screen.queryByRole('button', { name: 'Invite' })).not.toBeInTheDocument();
});

it('should show "New User" button if has create-user permission', () => {
	render(<UsersPageHeaderContent isSeatsCapExceeded={false} seatsCap={{ activeUsers: 1, maxActiveUsers: 1 }} />, {
		wrapper: mockAppRoot().withJohnDoe().withPermission('create-user').build(),
	});

	expect(screen.getByRole('button', { name: 'New_user' })).toBeInTheDocument();
});

it('should hide "New User" button if user doesnt have create-user permission', () => {
	render(<UsersPageHeaderContent isSeatsCapExceeded={false} seatsCap={{ activeUsers: 1, maxActiveUsers: 1 }} />, {
		wrapper: mockAppRoot().withJohnDoe().withPermission('create-user').build(),
	});

	expect(screen.getByRole('button', { name: 'New_user' })).toBeInTheDocument();
});

it('should show "Buy more seats" button if seats caps is exceeded', () => {
	render(<UsersPageHeaderContent isSeatsCapExceeded seatsCap={{ activeUsers: 1, maxActiveUsers: 1 }} />, {
		wrapper: mockAppRoot().withJohnDoe().build(),
	});

	expect(screen.getByRole('link', { name: 'Buy_more_seats' })).toBeInTheDocument();
});

it('should hide "Buy more seats" button if seats caps is within limits', () => {
	render(<UsersPageHeaderContent isSeatsCapExceeded={false} seatsCap={{ activeUsers: 1, maxActiveUsers: 1 }} />, {
		wrapper: mockAppRoot().withJohnDoe().build(),
	});

	expect(screen.queryByRole('link', { name: 'Buy_more_seats' })).not.toBeInTheDocument();
});

it('should show seats available progress bar', () => {
	render(<UsersPageHeaderContent isSeatsCapExceeded={false} seatsCap={{ activeUsers: 1, maxActiveUsers: 10 }} />, {
		wrapper: mockAppRoot().withJohnDoe().build(),
	});

	expect(screen.getByTestId('seats-cap-progress-bar')).toBeInTheDocument();
});

it('should hide seats available progress bar if theres no limit', () => {
	render(<UsersPageHeaderContent isSeatsCapExceeded={false} seatsCap={{ activeUsers: 1, maxActiveUsers: Number.POSITIVE_INFINITY }} />, {
		wrapper: mockAppRoot().withJohnDoe().build(),
	});

	expect(screen.queryByTestId('seats-cap-progress-bar')).not.toBeInTheDocument();
});
