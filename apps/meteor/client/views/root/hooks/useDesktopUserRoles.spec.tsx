import type { IUser } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { UserContext } from '@rocket.chat/ui-contexts';
import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { useContext } from 'react';

import { useDesktopUserRoles } from './useDesktopUserRoles';

type Session = { userId: string | undefined; user: IUser | null };

const loggedOut: Session = { userId: undefined, user: null };
const loading: Session = { userId: 'uid', user: null };
const loggedIn = (roles?: string[]): Session => ({ userId: 'uid', user: { _id: 'uid', roles } as IUser });

let session: Session;

const SessionProvider = ({ children }: { children: ReactNode }) => {
	const context = useContext(UserContext);
	return <UserContext.Provider value={{ ...context, ...session }}>{children}</UserContext.Provider>;
};

const AppRoot = mockAppRoot().build();

const wrapper = ({ children }: { children: ReactNode }) => (
	<AppRoot>
		<SessionProvider>{children}</SessionProvider>
	</AppRoot>
);

const mountWithSession = (initial: Session) => {
	session = initial;
	const { rerender } = renderHook(() => useDesktopUserRoles(), { wrapper });

	return (next: Session) => {
		session = next;
		rerender();
	};
};

describe('useDesktopUserRoles', () => {
	const setUserRoles = jest.fn();

	beforeEach(() => {
		Object.assign(window, { RocketChatDesktop: { setUserRoles } });
	});

	afterEach(() => {
		delete (window as { RocketChatDesktop?: unknown }).RocketChatDesktop;
		setUserRoles.mockClear();
	});

	it('should not call setUserRoles before the user id is set', () => {
		mountWithSession(loggedOut);

		expect(setUserRoles).not.toHaveBeenCalled();
	});

	it('should not call setUserRoles when the user id is set and the user document is not loaded', () => {
		mountWithSession(loading);

		expect(setUserRoles).not.toHaveBeenCalled();
	});

	it('should push the roles once the user document is loaded', () => {
		const update = mountWithSession(loggedOut);
		update(loading);
		update(loggedIn(['user', 'admin']));

		expect(setUserRoles.mock.calls).toEqual([[['user', 'admin']]]);
	});

	it('should push an empty list for a loaded user with no roles', () => {
		mountWithSession(loggedIn([]));

		expect(setUserRoles.mock.calls).toEqual([[[]]]);
	});

	it('should push an empty list once on logout after roles were pushed', () => {
		const update = mountWithSession(loggedIn(['user']));
		update(loading);
		update(loggedOut);
		update(loggedOut);

		expect(setUserRoles.mock.calls).toEqual([[['user']], [[]]]);
	});
});
