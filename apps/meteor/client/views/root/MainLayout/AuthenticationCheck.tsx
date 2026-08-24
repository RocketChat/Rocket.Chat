import { useSession, useUser, useSetting } from '@rocket.chat/ui-contexts';
import RegistrationRoute from '@rocket.chat/web-ui-registration';
import type { ReactNode } from 'react';

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
export type AuthenticationCheckProps = {
	children: ReactNode;
	guest?: boolean;
	/** Placeholder shown while the user is resolved — see `UsernameCheck`. */
	loading?: ReactNode;
};

const AuthenticationCheck = ({ children, guest, loading }: AuthenticationCheckProps) => {
	const user = useUser();
	const allowAnonymousRead = useSetting('Accounts_AllowAnonymousRead');
	const forceLogin = useSession('forceLogin');

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
	 */
	const isResumingSession = !user && !forceLogin && !!getStoredItem(STORAGE_KEYS.LOGIN_TOKEN);

	if (isResumingSession) {
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
