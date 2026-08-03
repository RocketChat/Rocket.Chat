import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { SessionContextValue } from '@rocket.chat/ui-contexts';
import { SessionContext } from '@rocket.chat/ui-contexts';
import { render, screen } from '@testing-library/react';

import AuthenticationCheck from './AuthenticationCheck';
import { STORAGE_KEYS } from '../../../lib/sdk/storage';

// The chain below this gate reaches for a great deal of app; what this spec is about is which of the three
// outcomes the gate picks, so stand the rest of it down.
jest.mock('./LoggedInArea', () => ({ __esModule: true, default: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
jest.mock('./UsernameCheck', () => ({ __esModule: true, default: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
jest.mock('./LoginPage', () => ({ __esModule: true, default: () => <div>login-page</div> }));
jest.mock('../../home/HomeSkeleton', () => ({ __esModule: true, default: () => <div>home-skeleton</div> }));

const renderGate = (root: ReturnType<typeof mockAppRoot>) =>
	render(<AuthenticationCheck loading={<div>route-placeholder</div>}>conference</AuthenticationCheck>, { wrapper: root.build() });

afterEach(() => {
	localStorage.clear();
});

it('renders the route for a user who is logged in', () => {
	renderGate(mockAppRoot().withJohnDoe());

	expect(screen.getByText('conference')).toBeInTheDocument();
});

it('shows the login page to a visitor with no session', () => {
	renderGate(mockAppRoot().withAnonymous());

	expect(screen.getByText('login-page')).toBeInTheDocument();
});

// The bug this guards: a window that opens with a session already stored — a call popout, or any plain reload —
// has no user until the login is resumed from that token, and showed a login form in the meantime.
describe('while the session is being resumed', () => {
	it('waits instead of showing the login page when a stored token is about to be used', () => {
		localStorage.setItem(STORAGE_KEYS.LOGIN_TOKEN, 'a-stored-token');

		renderGate(mockAppRoot().withAnonymous());

		expect(screen.queryByText('login-page')).not.toBeInTheDocument();
		expect(screen.getByText('route-placeholder')).toBeInTheDocument();
	});

	// Standalone routes pass their own placeholder; everything inside the app chrome keeps the skeleton it had.
	it('falls back to the app skeleton when the route offers no placeholder', () => {
		localStorage.setItem(STORAGE_KEYS.LOGIN_TOKEN, 'a-stored-token');

		render(<AuthenticationCheck>conference</AuthenticationCheck>, { wrapper: mockAppRoot().withAnonymous().build() });

		expect(screen.getByText('home-skeleton')).toBeInTheDocument();
	});

	// Someone who was logged out, or whose session the server rejected, must reach the form — otherwise a stale
	// token in storage would leave them staring at a placeholder forever. The mocked app root has no session
	// support, so this one supplies the context itself.
	it('shows the login page when a login is being forced', () => {
		localStorage.setItem(STORAGE_KEYS.LOGIN_TOKEN, 'a-stale-token');

		const forcingLogin = {
			query: () => [() => () => undefined, () => true] as ReturnType<SessionContextValue['query']>,
			dispatch: () => undefined,
		};

		renderGate(
			mockAppRoot()
				.withAnonymous()
				.wrap((children) => <SessionContext.Provider value={forcingLogin}>{children}</SessionContext.Provider>),
		);

		expect(screen.getByText('login-page')).toBeInTheDocument();
	});
});
