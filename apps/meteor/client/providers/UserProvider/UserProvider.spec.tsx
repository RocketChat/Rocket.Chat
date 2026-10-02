import type { IUser } from '@rocket.chat/core-typings';
import { UserContext, useUser, useUserPreference } from '@rocket.chat/ui-contexts';
import { act, render, screen } from '@testing-library/react';
import { useContext } from 'react';

import UserProvider from './UserProvider';
import { userIdStore } from '../../lib/user';
import { Users } from '../../stores';

jest.mock('../../lib/sdk/ddpSdk', () => ({
	getDdpSdk: () => ({ account: { onLogout: jest.fn() } }),
}));

jest.mock('../../meteor/accounts', () => ({
	logout: jest.fn(),
}));

const createUser = (overrides: Partial<IUser> = {}): IUser =>
	({
		_id: 'user-id',
		username: 'user',
		roles: ['user'],
		type: 'user',
		active: true,
		createdAt: new Date(),
		_updatedAt: new Date(),
		...overrides,
	}) as IUser;

const contextValues: unknown[] = [];

const Probe = () => {
	contextValues.push(useContext(UserContext));
	const user = useUser();
	const theme = useUserPreference<string>('themeAppearence');

	return (
		<>
			<span data-testid='username'>{user?.username ?? 'none'}</span>
			<span data-testid='theme'>{theme ?? 'none'}</span>
		</>
	);
};

describe('UserProvider', () => {
	beforeEach(() => {
		contextValues.length = 0;
		localStorage.clear();
		act(() => {
			Users.state.replaceAll([]);
			userIdStore.setState('user-id', true);
		});
	});

	it('keeps the context value while the user document changes', () => {
		act(() => Users.state.store(createUser()));

		render(
			<UserProvider>
				<Probe />
			</UserProvider>,
		);

		act(() => Users.state.store(createUser({ username: 'renamed', settings: { preferences: { themeAppearence: 'dark' } } })));

		expect(screen.getByTestId('username')).toHaveTextContent('renamed');
		expect(screen.getByTestId('theme')).toHaveTextContent('dark');
		expect(new Set(contextValues).size).toBe(1);
	});

	it('writes the language the server reports to both storage keys', () => {
		localStorage.setItem('fuselage-localStorage-userLanguage', JSON.stringify('en'));
		act(() => Users.state.store(createUser({ language: 'pt-BR' })));

		render(
			<UserProvider>
				<Probe />
			</UserProvider>,
		);

		expect(JSON.parse(localStorage.getItem('fuselage-localStorage-userLanguage') ?? 'null')).toBe('pt-BR');
		expect(JSON.parse(localStorage.getItem('fuselage-localStorage-preferedLanguage') ?? 'null')).toBe('pt-BR');
	});

	it('leaves the stored language alone when the server reports none', () => {
		localStorage.setItem('fuselage-localStorage-userLanguage', JSON.stringify('de'));
		act(() => Users.state.store(createUser()));

		render(
			<UserProvider>
				<Probe />
			</UserProvider>,
		);

		expect(JSON.parse(localStorage.getItem('fuselage-localStorage-userLanguage') ?? 'null')).toBe('de');
	});
});
