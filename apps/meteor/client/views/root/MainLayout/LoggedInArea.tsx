import { useUser } from '@rocket.chat/ui-contexts';
import { type ReactNode } from 'react';

import { useCustomEmoji } from '../hooks/loggedIn/useCustomEmoji';
import { useE2EEncryption } from '../hooks/loggedIn/useE2EEncryption';
// import { useFingerprintChange } from '../hooks/loggedIn/useFingerprintChange';
import { useFontStylePreference } from '../hooks/loggedIn/useFontStylePreference';
import { useForceLogout } from '../hooks/loggedIn/useForceLogout';
import { useLogoutCleanup } from '../hooks/loggedIn/useLogoutCleanup';
import { useNotificationUserCalendar } from '../hooks/loggedIn/useNotificationUserCalendar';
import { useNotifyUser } from '../hooks/loggedIn/useNotifyUser';
import { useOTRMessaging } from '../hooks/loggedIn/useOTRMessaging';
import { useRestrictedRoles } from '../hooks/loggedIn/useRestrictedRoles';
import { useRootUrlChange } from '../hooks/loggedIn/useRootUrlChange';
import { useStoreCookiesOnLogin } from '../hooks/loggedIn/useStoreCookiesOnLogin';
import { useTwoFactorAuthSetupCheck } from '../hooks/loggedIn/useTwoFactorAuthSetupCheck';
import { useUnread } from '../hooks/loggedIn/useUnread';
import { useUpdateVideoConfUser } from '../hooks/loggedIn/useUpdateVideoConfUser';
import { useWebRTC } from '../hooks/loggedIn/useWebRTC';

const LoggedInArea = ({ children }: { children: ReactNode }) => {
	const user = useUser();

	if (!user) {
		throw new Error('User not logged');
	}

	useFontStylePreference();
	useUnread();
	useNotifyUser(user);
	useUpdateVideoConfUser(user._id);
	useWebRTC(user._id);
	useOTRMessaging(user._id);
	useNotificationUserCalendar(user);
	useForceLogout(user._id);
	useStoreCookiesOnLogin(user._id);
	useCustomEmoji();
	useRestrictedRoles();
	// These 3 hooks below need to be called in this order due to the way our `setModal` works.
	// TODO: reevaluate `useSetModal`
	// useFingerprintChange();
	useRootUrlChange();
	useTwoFactorAuthSetupCheck();
	//
	useLogoutCleanup();
	useE2EEncryption();

	return children;
};

export default LoggedInArea;
