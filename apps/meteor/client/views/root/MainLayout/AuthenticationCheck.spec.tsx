import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { AuthenticationContextValue, SessionContextValue } from '@rocket.chat/ui-contexts';
import { AuthenticationContext, SessionContext } from '@rocket.chat/ui-contexts';
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';

import AuthenticationCheck from './AuthenticationCheck';
import { STORAGE_KEYS } from '../../../lib/sdk/storage';

// The chain below this gate reaches for a great deal of app; what this spec is about is which of the three
// outcomes the gate picks, so stand the rest of it down.
jest.mock('./LoggedInArea', () => ({ __esModule: true, default: ({ children }: { children: ReactNode }) => <>{children}</> }));
jest.mock('./UsernameCheck', () => ({ __esModule: true, default: ({ children }: { children: ReactNode }) => <>{children}</> }));
jest.mock('./LoginPage', () => ({ __esModule: true, default: () => <div>login-page</div> }));
jest.mock('../../home/HomeSkeleton', () => ({ __esModule: true, default: () => <div>home-skeleton</div> }));

const renderGate = (root: ReturnType<typeof mockAppRoot>) =>
	render(<AuthenticationCheck>conference</AuthenticationCheck>, { wrapper: root.build() });

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
	it('shows the skeleton instead of the login page when a stored token is about to be used', () => {
		localStorage.setItem(STORAGE_KEYS.LOGIN_TOKEN, 'a-stored-token');

		renderGate(mockAppRoot().withAnonymous());

		expect(screen.queryByText('login-page')).not.toBeInTheDocument();
		expect(screen.getByText('home-skeleton')).toBeInTheDocument();
	});

	// The one way a stored token could strand someone: it is cleared when a server *rejects* it, so a server that
	// never answers at all clears nothing. Once the connection stops trying, the form has to be reachable.
	// Synchronously: a window that mounts with the connection already given up must pick the form on its first
	// render, rather than showing a frame of skeleton on the way to it.
	it.each(['waiting', 'failed', 'offline'] as const)('shows the login page when the connection has given up (%s)', (status) => {
		localStorage.setItem(STORAGE_KEYS.LOGIN_TOKEN, 'a-stored-token');

		renderGate(mockAppRoot().withAnonymous().withServerContext({ connected: false, status }));

		expect(screen.getByText('login-page')).toBeInTheDocument();
		expect(screen.queryByText('home-skeleton')).not.toBeInTheDocument();
	});

	// ...but not while it is still the ordinary first connect of a page load, which is the flash this removes.
	it('keeps the skeleton up while the connection is still being made', () => {
		localStorage.setItem(STORAGE_KEYS.LOGIN_TOKEN, 'a-stored-token');

		renderGate(mockAppRoot().withAnonymous().withServerContext({ connected: false, status: 'connecting' }));

		expect(screen.getByText('home-skeleton')).toBeInTheDocument();
		expect(screen.queryByText('login-page')).not.toBeInTheDocument();
	});

	// Someone who was logged out, or whose session the server rejected, must reach the form — otherwise a stale
	// token in storage would leave them staring at a skeleton forever. The mocked app root has no session
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

// The regression that came with the guard above, and the reason it asks only about the stored token: `isLoggingIn`
// is true of *any* login in flight, a person typing their password at the form included. Swapping the form for a
// skeleton mid-attempt lost the rejection — the form came back blank, with neither field marked invalid — and
// iframe login never appeared at all, since the flow that fetches its URL runs from inside `LoginPage`.
it('keeps the login page up while someone is logging in at it', () => {
	const loggingIn = { isLoggingIn: true } as AuthenticationContextValue;

	renderGate(
		mockAppRoot()
			.withAnonymous()
			.wrap((children) => <AuthenticationContext.Provider value={loggingIn}>{children}</AuthenticationContext.Provider>),
	);

	expect(screen.getByText('login-page')).toBeInTheDocument();
	expect(screen.queryByText('home-skeleton')).not.toBeInTheDocument();
});
