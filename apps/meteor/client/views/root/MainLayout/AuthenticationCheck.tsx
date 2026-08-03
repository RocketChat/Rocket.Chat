import { useSession, useUser, useSetting, useIsLoggingIn } from '@rocket.chat/ui-contexts';
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
	const isLoggingIn = useIsLoggingIn();

	/**
	 * A window that opens with a session already stored — a call popout, or any plain reload — has no user until
	 * the login is resumed from that token. Treating "no user yet" as "not logged in" showed a login form for the
	 * few hundred milliseconds it took, to someone who never asked for one.
	 *
	 * `isLoggingIn` covers the resume once Meteor has started it; the stored token covers the instant before that,
	 * where nothing is in flight yet but a session plainly exists. A token that turns out to be stale is cleared
	 * when the resume fails, which lands here as an ordinary logged-out visitor.
	 */
	const isResumingSession = !user && !forceLogin && (isLoggingIn || !!getStoredItem(STORAGE_KEYS.LOGIN_TOKEN));

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
