import { useStream } from '@rocket.chat/ui-contexts';
import { useEffect, useState } from 'react';

import { useLicense } from '../useLicense';

export const useMacLimitValidations = (enabled: boolean) => {
	const { data: { preventedActions } = {}, isLoading, isError } = useLicense();
	const [isOverMacLimit, setOverMacLimit] = useState(preventedActions?.monthlyActiveContacts || false);
	const subscribe = useStream('notify-logged');

	useEffect(() => {
		if (!enabled || isLoading || isError) {
			return;
		}

		setOverMacLimit(preventedActions?.monthlyActiveContacts ?? false);
	}, [enabled, isError, isLoading, preventedActions?.monthlyActiveContacts]);

	useEffect(() => {
		if (!enabled) {
			return;
		}

		return subscribe(`mac.limit`, ({ limitReached }) => {
			setOverMacLimit(limitReached);
		});
	}, [subscribe, enabled]);

	return { isOverMacLimit };
};
