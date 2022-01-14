import { useSession } from '../../../contexts/SessionContext';
import { useSetting } from '../../../contexts/SettingsContext';
import { useUserId } from '../../../contexts/UserContext';

export const useAllowRead = (ready: boolean): boolean => {
	const uid = useUserId();
	const allowAnonymousRead = useSetting('Accounts_AllowAnonymousRead');
	const forceLogin = useSession('forceLogin');

	if (!ready) {
		return false;
	}

	return !!uid || (allowAnonymousRead === true && forceLogin !== true);
};
