import type { IUIActionButton, UIActionButtonContext } from '@rocket.chat/apps-engine/definition/ui';
import { useDebouncedCallback } from '@rocket.chat/fuselage-hooks';
import { useEndpoint, useSingleStream, useUserId } from '@rocket.chat/ui-contexts';
import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';

import type { MessageActionConfig, MessageActionContext } from '../../app/ui-utils/client/lib/MessageAction';
import type { MessageBoxAction } from '../../app/ui-utils/client/lib/messageBox';
import { Utilities } from '../../ee/lib/misc/Utilities';
import type { GenericMenuItemProps } from '../components/GenericMenu/GenericMenuItem';
import { useApplyButtonFilters, useApplyButtonAuthFilter } from './useApplyButtonFilters';
import { useUiKitActionManager } from './useUiKitActionManager';

const getIdForActionButton = ({ appId, actionId }: IUIActionButton): string => `${appId}/${actionId}`;

export const useAppActionButtons = (context?: `${UIActionButtonContext}`) => {
	const queryClient = useQueryClient();

	const apps = useSingleStream('apps');
	const uid = useUserId();

	const getActionButtons = useEndpoint('GET', '/apps/actionButtons');

	const result = useQuery(['apps', 'actionButtons'], () => getActionButtons(), {
		...(context && {
			select: (data) => data.filter((button) => button.context === context),
		}),
		staleTime: Infinity,
	});

	const invalidate = useDebouncedCallback(
		() => {
			queryClient.invalidateQueries(['apps', 'actionButtons']);
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

export const useMessageboxAppsActionButtons = () => {
	const result = useAppActionButtons('messageBoxAction');
	const actionManager = useUiKitActionManager();

	const applyButtonFilters = useApplyButtonFilters();

	const data = useMemo(
		() =>
			result.data
				?.filter((action) => {
					return applyButtonFilters(action);
				})
				.map((action) => {
					const item: MessageBoxAction = {
						id: getIdForActionButton(action),
						label: Utilities.getI18nKeyForApp(action.labelI18n, action.appId),
						action: (params) => {
							void actionManager.triggerActionButtonAction({
								rid: params.rid,
								tmid: params.tmid,
								actionId: action.actionId,
								appId: action.appId,
								payload: { context: action.context, message: params.chat.composer?.text },
							});
						},
					};

					return item;
				}),
		[actionManager, applyButtonFilters, result.data],
	);
	return {
		...result,
		data,
	} as UseQueryResult<MessageBoxAction[]>;
};

export const useUserDropdownAppsActionButtons = () => {
	const result = useAppActionButtons('userDropdownAction');
	const actionManager = useUiKitActionManager();

	const applyButtonFilters = useApplyButtonAuthFilter();

	const data = useMemo(
		() =>
			result.data
				?.filter((action) => {
					return applyButtonFilters(action);
				})
				.map((action) => {
					return {
						id: `${action.appId}_${action.actionId}`,
						// icon: action.icon as GenericMenuItemProps['icon'],
						content: action.labelI18n,
						onClick: () => {
							actionManager.triggerActionButtonAction({
								actionId: action.actionId,
								appId: action.appId,
								payload: { context: action.context },
							});
						},
					};
				}),
		[actionManager, applyButtonFilters, result.data],
	);
	return {
		...result,
		data,
	} as UseQueryResult<GenericMenuItemProps[]>;
};

export const useMessageActionAppsActionButtons = (context?: MessageActionContext) => {
	const result = useAppActionButtons('messageAction');
	const actionManager = useUiKitActionManager();
	const applyButtonFilters = useApplyButtonFilters();
	const data = useMemo(
		() =>
			result.data
				?.filter((action) => {
					if (
						context &&
						!(action.when?.messageActionContext || ['message', 'message-mobile', 'threads', 'starred']).includes(context as any)
					) {
						return false;
					}
					return applyButtonFilters(action);
				})
				.map((action) => {
					const item: MessageActionConfig = {
						icon: undefined as any,
						id: getIdForActionButton(action),
						label: Utilities.getI18nKeyForApp(action.labelI18n, action.appId),
						order: 7,
						type: 'apps',
						variant: action.variant,
						action: (_, params) => {
							void actionManager.triggerActionButtonAction({
								rid: params.message.rid,
								tmid: params.message.tmid,
								mid: params.message._id,
								actionId: action.actionId,
								appId: action.appId,
								payload: { context: action.context },
							});
						},
					};

					return item;
				}),
		[actionManager, applyButtonFilters, context, result.data],
	);
	return {
		...result,
		data,
	} as UseQueryResult<MessageActionConfig[]>;
};
