import { useOnLogout, useSetting } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

import { useFireGlobalEvent } from '../../../../hooks/useFireGlobalEvent';
import { closeAllRooms } from '../closeAllRooms';
import { purgeAllDrafts } from '../purgeAllDrafts';

export const useLogoutCleanup = () => {
	const onLogout = useOnLogout();
	const logoutCustomScript = useSetting('Custom_Script_On_Logout');
	const { mutate: fireLogoutCustomScript } = useFireGlobalEvent('Custom_Script_On_Logout');

	useEffect(() => {
		return onLogout(() => {
			purgeAllDrafts();
			closeAllRooms();
			fireLogoutCustomScript(logoutCustomScript);
		});
	}, [fireLogoutCustomScript, logoutCustomScript, onLogout]);
};
