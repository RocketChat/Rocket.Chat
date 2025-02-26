import { type IUIActionButton, type UIActionButtonContext } from '@rocket.chat/apps-engine/definition/ui';
import { useDebouncedCallback } from '@rocket.chat/fuselage-hooks';
import { useConnectionStatus, useEndpoint, useStream, useUserId } from '@rocket.chat/ui-contexts';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

export const getIdForActionButton = ({ appId, actionId }: IUIActionButton): string => `${appId}/${actionId}`;

export const useAppActionButtons = <TContext extends `${UIActionButtonContext}`>(context?: TContext) => {
	const queryClient = useQueryClient();
	const apps = useStream('apps');
	const uid = useUserId();
	const { status } = useConnectionStatus();

	const getActionButtons = useEndpoint('GET', '/apps/actionButtons');

	const result = useQuery({
		queryKey: ['apps', 'actionButtons', status],
		enabled: status === 'connected',
		queryFn: () => getActionButtons(),

		...(context && {
			select: (data: IUIActionButton[]) =>
				data.filter(
					(
						button,
					): button is IUIActionButton & {
						context: UIActionButtonContext extends infer X ? (X extends TContext ? X : never) : never;
					} => button.context === context,
				),
		}),

		staleTime: Infinity,
	});

	const invalidate = useDebouncedCallback(
		() => {
			queryClient.invalidateQueries({
				queryKey: ['apps', 'actionButtons'],
			});
		},
		100,
		[],
	);

	useEffect(() => {
		if (!uid) {
			return;
		}

		return apps('apps', ([key]) => {
			if (['actions/changed'].includes(key)) {
				invalidate();
			}
		});
	}, [uid, apps, invalidate]);

	return result;
};
