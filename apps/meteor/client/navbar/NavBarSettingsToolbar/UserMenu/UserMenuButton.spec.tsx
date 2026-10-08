import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';

import UserMenuButton from './UserMenuButton';

describe('UserMenuButton', () => {
	it.each([
		{
			scenario: 'the real status by default',
			presenceDisabledByAdmin: false,
			adminStatusHiding: true,
			userStatus: true,
			expected: 'online',
		},
		{
			scenario: 'offline when an admin disabled it',
			presenceDisabledByAdmin: true,
			adminStatusHiding: true,
			userStatus: true,
			expected: 'offline',
		},
		{
			scenario: 'the real status when admin status hiding is off',
			presenceDisabledByAdmin: true,
			adminStatusHiding: false,
			userStatus: true,
			expected: 'online',
		},
		{
			scenario: 'offline when status is off for the workspace',
			presenceDisabledByAdmin: false,
			adminStatusHiding: true,
			userStatus: false,
			expected: 'offline',
		},
	])('shows $scenario', ({ presenceDisabledByAdmin, adminStatusHiding, userStatus, expected }) => {
		render(<UserMenuButton icon='user' />, {
			wrapper: mockAppRoot()
				.withUser({ _id: 'alice-id', username: 'alice', status: 'online', presenceDisabledByAdmin } as any)
				.withSetting('Accounts_StatusVisibility_Admin_Enabled', adminStatusHiding)
				.withSetting('Accounts_UserStatus_Enabled', userStatus)
				.build(),
		});

		// eslint-disable-next-line testing-library/no-node-access
		expect(screen.getByRole('status').querySelector(`.rcx-status-bullet--${expected}`)).toBeInTheDocument();
	});
});
