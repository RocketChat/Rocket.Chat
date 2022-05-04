import { useEffect } from 'react';

import { useUserId } from '../../../contexts/UserContext';
import { fireGlobalEvent } from '../../../lib/utils/fireGlobalEvent';

export const useCustomScript = (): void => {
	const uid = useUserId();
	useEffect(() => {
		if (uid) {
			fireGlobalEvent('Custom_Script_Logged_In');
			return;
		}

		fireGlobalEvent('Custom_Script_Logged_Out');
	}, [uid]);
};
