import { useUser } from '@rocket.chat/ui-contexts';
import type { ReactNode } from 'react';

import { useCustomEmoji } from '../../../hooks/customEmoji/useCustomEmoji';
import { useNotificationUserCalendar } from '../../../hooks/notification/useNotificationUserCalendar';
import { useNotifyUser } from '../../../hooks/notification/useNotifyUser';
// import { useFingerprintChange } from '../../../hooks/useFingerprintChange';
import { useFontStylePreference } from '../../../hooks/useFontStylePreference';
import { useRestrictedRoles } from '../../../hooks/useRestrictedRoles';
import { useRootUrlChange } from '../../../hooks/useRootUrlChange';
import { useTwoFactorAuthSetupCheck } from '../../../hooks/useTwoFactorAuthSetupCheck';
import { useUnread } from '../../../hooks/useUnread';
import { useForceLogout } from '../hooks/useForceLogout';
import { useLogoutCleanup } from '../hooks/useLogoutCleanup';
import { useOTRMessaging } from '../hooks/useOTRMessaging';
import { useStoreCookiesOnLogin } from '../hooks/useStoreCookiesOnLogin';
import { useUpdateVideoConfUser } from '../hooks/useUpdateVideoConfUser';
import { useWebRTC } from '../hooks/useWebRTC';

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

	return children;
};

export default LoggedInArea;
