import type { IUIActionButton, UIActionButtonContext } from '@rocket.chat/apps-engine/definition/ui';
import { useEndpoint, useStream, useUserId } from '@rocket.chat/ui-contexts';
import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useMemo } from 'react';

import type { MessageActionConfig, MessageActionContext } from '../../app/ui-utils/client/lib/MessageAction';
import type { MessageBoxAction } from '../../app/ui-utils/client/lib/messageBox';
import { Utilities } from '../../ee/lib/misc/Utilities';
import type { GenericMenuItemProps } from '../components/GenericMenu/GenericMenuItem';
import { useRoom } from '../views/room/contexts/RoomContext';
import type { ToolboxAction } from '../views/room/lib/Toolbox';
import { useApplyButtonFilters, useApplyButtonAuthFilter } from './useApplyButtonFilters';
import { useUiKitActionManager } from './useUiKitActionManager';

const getIdForActionButton = ({ appId, actionId }: IUIActionButton): string => `${appId}/${actionId}`;

export const useAppActionButtons = (context?: `${UIActionButtonContext}`) => {
	const stream = useRef<() => void>();
	const queryClient = useQueryClient();

	const apps = useStream('apps');
	const uid = useUserId();

	useEffect(() => () => stream.current?.(), []);

	useQuery(
		['apps', 'stream', 'actionButtons', uid],
		() => {
			if (!uid) {
				return [];
			}
			stream.current?.();
			stream.current = apps('actions/changed', () => {
				queryClient.invalidateQueries(['apps', 'actionButtons']);
			});

			return [];
		},
		{
			refetchOnWindowFocus: false,
		},
	);

	const getActionButtons = useEndpoint('GET', '/apps/actionButtons');

	const result = useQuery(['apps', 'actionButtons'], () => getActionButtons(), {
		...(context && {
			select: (data) => data.filter((button) => button.context === context),
		}),
	});
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

export const useRoomActionAppsActionButtons = (context?: MessageActionContext) => {
	const result = useAppActionButtons('roomAction');
	const actionManager = useUiKitActionManager();
	const applyButtonFilters = useApplyButtonFilters();
	const room = useRoom();
	const data = useMemo(
		() =>
			result.data
				?.filter((action) => {
					if (context && ['group', 'channel', 'live', 'team', 'direct', 'direct_multiple'].includes(context)) {
						return false;
					}
					return applyButtonFilters(action);
				})
				.map((action) => {
					const item: [string, ToolboxAction] = [
						action.actionId,
						{
							id: action.actionId,
							icon: undefined as any, // Apps won't provide icons for now
							order: 300, // Make sure the button only shows up inside the room toolbox
							title: Utilities.getI18nKeyForApp(action.labelI18n, action.appId),
							groups: ['group', 'channel', 'live', 'team', 'direct', 'direct_multiple'],
							// Filters were applied in the applyButtonFilters function
							// if the code made it this far, the button should be shown
							action: () =>
								void actionManager.triggerActionButtonAction({
									rid: room._id,
									actionId: action.actionId,
									appId: action.appId,
									payload: { context: action.context },
								}),
						},
					];
					return item;
				}),
		[actionManager, applyButtonFilters, context, result.data, room._id],
	);
	return {
		...result,
		data,
	} as UseQueryResult<[string, ToolboxAction][]>;
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
						action: (_, params) => {
							void actionManager.triggerActionButtonAction({
								rid: params.message.rid,
								tmid: params.message.tmid,
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
