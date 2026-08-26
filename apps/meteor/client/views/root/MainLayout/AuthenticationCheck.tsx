import { useConnectionStatus, useSession, useUser, useSetting } from '@rocket.chat/ui-contexts';
import RegistrationRoute from '@rocket.chat/web-ui-registration';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';

import LoggedInArea from './LoggedInArea';
import LoginPage from './LoginPage';
import UsernameCheck from './UsernameCheck';
import { STORAGE_KEYS, getStoredItem } from '../../../lib/sdk/storage';
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
export type AuthenticationCheckProps = { children: ReactNode; guest?: boolean };

/**
 * The connection states that mean a server was reached for and lost, as opposed to not having answered yet.
 *
 * `offline` is deliberately not one of them, however much it sounds like the plainest case: the DDP SDK begins
 * every page load `idle`, and `sdkStatusToMeteor` reports `idle` as `offline`. Counting it would give up on the
 * connection before it had been attempted, on exactly the healthy reloads this exists to protect.
 */
const hasGivenUp = (status: ReturnType<typeof useConnectionStatus>['status']): boolean => status === 'waiting' || status === 'failed';

const AuthenticationCheck = ({ children, guest }: AuthenticationCheckProps) => {
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
	 * A window that opens with a session already stored — a call popout, or any plain reload — has no user until
	 * the login is resumed from that token. Treating "no user yet" as "not logged in" showed a login form for the
	 * few hundred milliseconds it took, to someone who never asked for one.
	 *
	 * The stored token is the whole of the test, and deliberately so. It is written before the window loads and
	 * removed only on an explicit logout or a failed resume, so it covers the resume from end to end. Asking
	 * `isLoggingIn` as well looked like it covered the same ground more directly, but it is true of *any* login in
	 * flight, including one someone is making at the form right now: that unmounted the form mid-attempt, so a
	 * rejected password came back to a blank form with nothing marked invalid, and iframe login — which runs from
	 * inside `LoginPage` — could never get as far as showing its own form at all.
	 *
	 * The token is read per render rather than subscribed to, so a stale one only falls through on the next
	 * render. That is safe because every path that rejects a stored token removes it — `makeClientLoggedOut` via
	 * Meteor's reconnect hook, and `clearStoredCredentials()` from `ensureConnectedAndAuthenticated` and
	 * `runUserDataSync` — and the expired-token page load clears it before React even mounts. Those are all
	 * rejections, though, which is why the unreachable case above is bounded separately.
	 */
	const isResumingSession = !user && !forceLogin && !unreachable && !!getStoredItem(STORAGE_KEYS.LOGIN_TOKEN);

	if (isResumingSession) {
		return <HomeSkeleton />;
	}

	if (user) {
		return (
			<LoggedInArea>
				<UsernameCheck>{children}</UsernameCheck>
			</LoggedInArea>
		);
	}

	if (!forceLogin && guest) {
		return <RegistrationRoute defaultRoute='guest'>{children}</RegistrationRoute>;
	}

	if (!forceLogin && allowAnonymousRead) {
		return <UsernameCheck>{children}</UsernameCheck>;
	}

	return <LoginPage />;
};

export default AuthenticationCheck;
