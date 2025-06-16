import { useSession, useUser, useSetting } from '@rocket.chat/ui-contexts';
import RegistrationRoute from '@rocket.chat/web-ui-registration';
import type { ReactElement, ReactNode } from 'react';

import LoggedInArea from './LoggedInArea';
import LoginPage from './LoginPage';
import UsernameCheck from './UsernameCheck';

/*
 * Anonymous and guest are similar in some way
 *
 * Anonymous is an old feature that allows the user to navigate as an anonymus user
 * by default the user dont need to do anything its hadled by the system but by behind the scenes a new    * user is registered
 *
 * Guest is only for certain locations, it shows a form asking if the user wants to stay as guest and if so
 * renders the page, without creating an user (not even an anonymous user)
 */
const AuthenticationCheck = ({ children, guest }: { children: ReactNode; guest?: boolean }): ReactElement => {
	const user = useUser();
	const allowAnonymousRead = useSetting('Accounts_AllowAnonymousRead');
	const forceLogin = useSession('forceLogin');

	if (user) {
		return (
			<LoggedInArea>
				<UsernameCheck>{children}</UsernameCheck>
			</LoggedInArea>
		);
	}

	if (!forceLogin && guest) {
		return <RegistrationRoute defaultRoute='guest' children={children} />;
	}

	if (!forceLogin && allowAnonymousRead) {
		return <UsernameCheck>{children}</UsernameCheck>;
	}

	return <LoginPage />;
};

export default AuthenticationCheck;
