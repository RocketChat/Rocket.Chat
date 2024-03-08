import { useCallback } from 'preact/hooks';

import { createToken } from '../../../lib/random';
import { useStore } from '../../../store';

export const useAlert = () => {
	const { alerts, dispatch } = useStore();

	return useCallback(
		(text: string, { error = false, timeout = 10000 }: { error: boolean; timeout: number }) => {
			const alert = {
				id: createToken(),
				children: text,
				error,
				timeout,
			};
			dispatch({ alerts: (alerts.push(alert), alerts) });
		},
		[alerts, dispatch],
	);
};
