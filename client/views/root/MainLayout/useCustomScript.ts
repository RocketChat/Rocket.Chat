import { useEffect } from 'react';

import { fireGlobalEvent } from '../../../lib/utils/fireGlobalEvent';

export const useCustomScript = (): void => {
	useEffect(() => {
		fireGlobalEvent('Custom_Script_Logged_In');

		return (): void => {
			fireGlobalEvent('Custom_Script_Logged_Out');
		};
	}, []);
};
