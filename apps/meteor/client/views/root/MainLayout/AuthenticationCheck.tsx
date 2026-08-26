import { useConnectionStatus, useSession, useUser, useSetting } from '@rocket.chat/ui-contexts';
import RegistrationRoute from '@rocket.chat/web-ui-registration';
import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';

import LoggedInArea from './LoggedInArea';
import LoginPage from './LoginPage';
import UsernameCheck from './UsernameCheck';
import { useStoredItem } from '../../../hooks/useStoredItem';
import { STORAGE_KEYS } from '../../../lib/sdk/storage';
import HomeSkeleton from '../../home/HomeSkeleton';

/*
 * Anonymous and guest are similar in some way
 *
 * Anonymous is an old feature that allows the user to navigate as an anonymus user
 * by default the user dont need to do anything its hadled by the system but by behind the scenes a new    * user is registered
 *
 * Guest is only for certain locations, it shows a form asking if the user wants to stay as guest and if so
 * renders the page, without creating an user (not even an anonymous user)
 */
export type AuthenticationCheckProps = {
	children: ReactNode;
	guest?: boolean;
	/** Placeholder shown while the user is resolved — see `UsernameCheck`. */
	loading?: ReactNode;
};

/**
 * The connection states that mean a server was reached for and lost, as opposed to not having answered yet.
 *
 * `offline` is deliberately not one of them, however much it sounds like the plainest case: the DDP SDK begins
 * every page load `idle`, and `sdkStatusToMeteor` reports `idle` as `offline`. Counting it would give up on the
 * connection before it had been attempted, on exactly the healthy reloads this exists to protect.
 */
const hasGivenUp = (status: ReturnType<typeof useConnectionStatus>['status']): boolean => status === 'waiting' || status === 'failed';

const AuthenticationCheck = ({ children, guest, loading }: AuthenticationCheckProps) => {
	const user = useUser();
	const allowAnonymousRead = useSetting('Accounts_AllowAnonymousRead');
	const forceLogin = useSession('forceLogin');

	const { status } = useConnectionStatus();

	/**
	 * A resume needs a server to answer it, and waiting on one that never will is the one way this can strand
	 * someone: the token is only cleared when a server *rejects* it, so an unreachable server — a dropped network,
	 * a captive portal, a workspace that is down — clears nothing and would leave the skeleton up for good.
	 *
	 * Which states count is the whole of the care here — see `hasGivenUp`, and note that neither `connecting` nor
	 * `offline` is one of them. Once a state that counts has been seen it stands: a retry flapping between
	 * `waiting` and `connecting` must not flap the form back into a skeleton. A resume that succeeds later brings
	 * a user with it, which wins anyway.
	 *
	 * Seeded from the status rather than latched from `false`, so a mount that is *already* offline picks the form
	 * on its first render instead of showing a frame of skeleton on the way to it.
	 */
	const [unreachable, setUnreachable] = useState(() => hasGivenUp(status));

	useEffect(() => {
		if (hasGivenUp(status)) {
			setUnreachable(true);
		}
	}, [status]);

	/**
	 * A resume is something that happens *before* the first user of a mount, never after one. Once a user has been
	 * seen, a user that goes away again is a session that ended — a logout, an account deleted from under itself,
	 * a token the server revoked — and the form, not a skeleton, is the answer. Latching this is what keeps the
	 * skeleton bounded by something the component owns, rather than by every path that drops a session
	 * remembering to clear the stored token on its way out: deleting your own account does not, and left the
	 * skeleton up for good.
	 */
	const hasSeenUser = useRef(false);
	if (user) {
		hasSeenUser.current = true;
	}

	/**
	 * A window that opens with a session already stored — a call popout, or any plain reload — has no user until
	 * the login is resumed from that token. Treating "no user yet" as "not logged in" showed a login form for the
	 * few hundred milliseconds it took, to someone who never asked for one.
	 *
	 * The stored token is the whole of the test, and deliberately so. It is written before the window loads and
	 * removed on an explicit logout or a rejected resume, so it covers the resume from end to end. Asking
	 * `isLoggingIn` as well looked like it covered the same ground more directly, but it is true of *any* login in
	 * flight, including one someone is making at the form right now: that unmounted the form mid-attempt, so a
	 * rejected password came back to a blank form with nothing marked invalid, and iframe login — which runs from
	 * inside `LoginPage` — could never get as far as showing its own form at all.
	 *
	 * Subscribed to rather than read per render, because the writes that matter here are same-tab ones and those
	 * announce themselves to nobody: `clearStoredCredentials()` ends by nulling a connection userId that is
	 * *already* null on a resume that never got a user, so neither the Tracker dep nor the userId store fires and
	 * there is no next render to fall through on. See `useStoredItem`.
	 */
	const loginToken = useStoredItem(STORAGE_KEYS.LOGIN_TOKEN);

	const isResumingSession = !user && !hasSeenUser.current && !forceLogin && !unreachable && !!loginToken;

	if (isResumingSession) {
		// A route that brought its own placeholder gets it here too: the app-shaped skeleton is the wrong shape
		// for a window that never shows the app around it.
		return <>{loading ?? <HomeSkeleton />}</>;
	}

	if (user) {
		return (
			<LoggedInArea>
				<UsernameCheck loading={loading}>{children}</UsernameCheck>
			</LoggedInArea>
		);
	}

	if (!forceLogin && guest) {
		return <RegistrationRoute defaultRoute='guest'>{children}</RegistrationRoute>;
	}

	if (!forceLogin && allowAnonymousRead) {
		return <UsernameCheck loading={loading}>{children}</UsernameCheck>;
	}

	return <LoginPage />;
};

export default AuthenticationCheck;
