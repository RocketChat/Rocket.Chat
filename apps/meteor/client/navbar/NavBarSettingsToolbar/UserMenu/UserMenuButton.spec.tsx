import { UserStatus, type IUser } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { UserContext } from '@rocket.chat/ui-contexts';
import { render, screen, waitFor } from '@testing-library/react';
import { useContext, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import UserMenuButton from './UserMenuButton';

const UserMenuButtonWithStatus = ({ status, language }: { status: IUser['status']; language?: string }) => {
	const userContext = useContext(UserContext);
	const { i18n } = useTranslation();
	useEffect(() => {
		if (language) {
			void i18n.changeLanguage(language);
		}
	}, [i18n, language]);
	return (
		<UserContext.Provider value={{ ...userContext, user: userContext.user && { ...userContext.user, status } }}>
			<UserMenuButton icon='user' aria-label='User menu' />
		</UserContext.Provider>
	);
};

const appRoot = () =>
	mockAppRoot()
		.withUser({ _id: 'alice-id', username: 'alice', status: 'online' } as IUser)
		.withTranslations('en', 'core', {
			Online: 'Online',
			Away: 'Away',
			Busy: 'Busy',
			Offline: 'Offline',
			User_status_disabled: 'Status disabled',
		})
		.withTranslations('pt-BR', 'core', { Away: 'Ausente' });

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
		expect(screen.getByRole('button').querySelector(`.rcx-button__badge .rcx-status-bullet--${expected}`)).toBeInTheDocument();
	});

	it.each([
		{ scenario: 'the real status', settings: {}, presenceDisabledByAdmin: false, expected: 'Online' },
		{
			scenario: 'Offline when status is off for the workspace',
			settings: { Accounts_UserStatus_Enabled: false },
			presenceDisabledByAdmin: false,
			expected: 'Offline',
		},
		{
			scenario: 'Offline when an admin hid it',
			settings: { Accounts_StatusVisibility_Admin_Enabled: true },
			presenceDisabledByAdmin: true,
			expected: 'Offline',
		},
		{
			scenario: 'that status is disabled when presence broadcast is off',
			settings: { Presence_broadcast_disabled: true },
			presenceDisabledByAdmin: false,
			expected: 'Status disabled',
		},
	])('describes the button with $scenario', ({ settings, presenceDisabledByAdmin, expected }) => {
		const root = appRoot().withUser({ _id: 'alice-id', username: 'alice', status: 'online', presenceDisabledByAdmin } as IUser);
		Object.entries(settings).forEach(([id, value]) => root.withSetting(id, value));

		render(<UserMenuButton icon='user' aria-label='User menu' />, { wrapper: root.build() });

		expect(screen.getByRole('button', { name: 'User menu' })).toHaveAccessibleDescription(expected);
	});

	it('updates the description and announces the status only when it changes', () => {
		const { rerender } = render(<UserMenuButtonWithStatus status={UserStatus.AWAY} />, { wrapper: appRoot().build() });

		expect(screen.getByRole('button', { name: 'User menu' })).toHaveAccessibleDescription('Away');
		expect(screen.getByRole('status')).toBeEmptyDOMElement();

		rerender(<UserMenuButtonWithStatus status={UserStatus.BUSY} />);

		expect(screen.getByRole('button', { name: 'User menu' })).toHaveAccessibleDescription('Busy');
		expect(screen.getByRole('status')).toHaveTextContent('Busy');
	});

	it('does not announce when only the language changes', async () => {
		const { rerender } = render(<UserMenuButtonWithStatus status={UserStatus.AWAY} />, { wrapper: appRoot().build() });

		rerender(<UserMenuButtonWithStatus status={UserStatus.AWAY} language='pt-BR' />);

		await waitFor(() => expect(screen.getByRole('button', { name: 'User menu' })).toHaveAccessibleDescription('Ausente'));
		expect(screen.getByRole('status')).toBeEmptyDOMElement();
	});

	it('keeps the description passed by the caller', () => {
		render(
			<>
				<span id='caller-hint'>Opens the user menu</span>
				<UserMenuButton icon='user' aria-label='User menu' aria-describedby='caller-hint' />
			</>,
			{ wrapper: appRoot().build() },
		);

		expect(screen.getByRole('button', { name: 'User menu' })).toHaveAccessibleDescription('Opens the user menu Online');
	});
});
