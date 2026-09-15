import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { AuthenticationContextValue, SessionContextValue } from '@rocket.chat/ui-contexts';
import { AuthenticationContext, SessionContext, UserContext } from '@rocket.chat/ui-contexts';
import { act, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { useContext } from 'react';

import AuthenticationCheck from './AuthenticationCheck';
import { STORAGE_KEYS, removeStoredItem } from '../../../lib/sdk/storage';

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

	// The stored token is read through a subscription, not per render, and this is why: a rejected resume clears
	// the credentials without anything else about the gate changing — no user arrives, the status stays healthy —
	// so a per-render read would sit on the stale token with no next render to correct it.
	it('falls through to the login page when the stored token is cleared under it', () => {
		localStorage.setItem(STORAGE_KEYS.LOGIN_TOKEN, 'a-token-the-server-rejects');

		renderGate(mockAppRoot().withAnonymous());

		expect(screen.getByText('home-skeleton')).toBeInTheDocument();

		act(() => {
			removeStoredItem(STORAGE_KEYS.LOGIN_TOKEN);
		});

		expect(screen.getByText('login-page')).toBeInTheDocument();
		expect(screen.queryByText('home-skeleton')).not.toBeInTheDocument();
	});

	// The one way a stored token could strand someone: it is cleared when a server *rejects* it, so a server that
	// never answers at all clears nothing. Once the connection stops trying, the form has to be reachable.
	it.each(['waiting', 'failed'] as const)('shows the login page when the connection has given up (%s)', (status) => {
		localStorage.setItem(STORAGE_KEYS.LOGIN_TOKEN, 'a-stored-token');

		renderGate(mockAppRoot().withAnonymous().withServerContext({ connected: false, status }));

		expect(screen.getByText('login-page')).toBeInTheDocument();
		expect(screen.queryByText('home-skeleton')).not.toBeInTheDocument();
	});

	// `offline` is not a give-up state, however much it reads like one: the DDP SDK starts every page load `idle`
	// and that is reported as `offline`, so counting it would show the form on healthy reloads — the very bug.
	it('keeps the skeleton up while the connection is merely idle', () => {
		localStorage.setItem(STORAGE_KEYS.LOGIN_TOKEN, 'a-stored-token');

		renderGate(mockAppRoot().withAnonymous().withServerContext({ connected: false, status: 'offline' }));

		expect(screen.getByText('home-skeleton')).toBeInTheDocument();
		expect(screen.queryByText('login-page')).not.toBeInTheDocument();
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

// Overrides whatever user the mocked root supplies, without changing the shape of the tree — the gate has to keep
// the same instance across the switch for the test to be about anything.
const MaybeSessionEnded = ({ ended, children }: { ended: boolean; children: ReactNode }) => {
	const value = useContext(UserContext);

	return <UserContext.Provider value={ended ? { ...value, userId: undefined, user: null } : value}>{children}</UserContext.Provider>;
};

// Deleting your own account ends the session server-side but clears nothing locally: the stored token stays put,
// and reading it alone the gate answered "a resume is in flight" and held the skeleton up for good. A user that
// has already been seen going away is an ended session, whatever storage still says.
it('shows the login page when the user goes away with a token still stored', () => {
	localStorage.setItem(STORAGE_KEYS.LOGIN_TOKEN, 'a-token-nobody-cleared');

	const Root = mockAppRoot().withJohnDoe().build();

	const { rerender } = render(
		<Root>
			<MaybeSessionEnded ended={false}>
				<AuthenticationCheck>conference</AuthenticationCheck>
			</MaybeSessionEnded>
		</Root>,
	);

	expect(screen.getByText('conference')).toBeInTheDocument();

	rerender(
		<Root>
			<MaybeSessionEnded ended={true}>
				<AuthenticationCheck>conference</AuthenticationCheck>
			</MaybeSessionEnded>
		</Root>,
	);

	expect(screen.getByText('login-page')).toBeInTheDocument();
	expect(screen.queryByText('home-skeleton')).not.toBeInTheDocument();
});
