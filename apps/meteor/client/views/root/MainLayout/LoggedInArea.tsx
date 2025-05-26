import { useUser } from '@rocket.chat/ui-contexts';
import type { ReactNode } from 'react';

import { useCustomEmoji } from '../../../hooks/customEmoji/useCustomEmoji';
import { useNotificationUserCalendar } from '../../../hooks/notification/useNotificationUserCalendar';
import { useNotifyUser } from '../../../hooks/notification/useNotifyUser';
import { useRestrictedRoles } from '../../../hooks/useRestrictedRoles';
import { useUnread } from '../../../hooks/useUnread';
import { useForceLogout } from '../hooks/useForceLogout';
import { useOTRMessaging } from '../hooks/useOTRMessaging';
import { useStoreCookiesOnLogin } from '../hooks/useStoreCookiesOnLogin';
import { useUpdateVideoConfUser } from '../hooks/useUpdateVideoConfUser';
import { useWebRTC } from '../hooks/useWebRTC';

const LoggedInArea = ({ children }: { children: ReactNode }) => {
	const user = useUser();

	if (!user) {
		throw new Error('User not logged');
	}

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

	return children;
};

export default LoggedInArea;
