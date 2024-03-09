import { useCallback } from 'preact/hooks';

import { createToken } from '../../../lib/random';
import { useStore } from '../../../store';

export const useAlert = () => {
	const { dispatch } = useStore();

	const remove = useCallback(
		(id: string) => {
			dispatch(({ alerts }) => ({ alerts: alerts.filter((alert) => alert.id !== id) }));
		},
		[dispatch],
	);

	const alert = useCallback(
		(
			text: string,
			{
				error,
				timeout = 10000,
				success,
			}: {
				error?: true;
				timeout?: number;
				success?: true;
			},
		) => {
			const alert = {
				id: createToken(),
				children: text,
				error,
				success,
				timeout,
			};

			dispatch(({ alerts }) => ({ alerts: (alerts.push(alert), alerts) }));

			return () => remove(alert.id);
		},
		[dispatch, remove],
	);

	return { alert, remove };
};
