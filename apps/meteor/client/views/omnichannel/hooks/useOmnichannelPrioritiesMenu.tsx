import type { IRoom } from '@rocket.chat/core-typings';
import { LivechatPriorityWeight } from '@rocket.chat/core-typings';
import { useEndpoint, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useOmnichannelPriorities } from './useOmnichannelPriorities';
import { PRIORITIES_CONFIG } from './useOmnichannelPrioritiesConfig';
import { roomsQueryKeys } from '../../../lib/queryKeys';

export const useOmnichannelPrioritiesMenu = (rid: IRoom['_id']) => {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const updateRoomPriority = useEndpoint('POST', '/v1/livechat/room/:rid/priority', { rid });
	const removeRoomPriority = useEndpoint('DELETE', '/v1/livechat/room/:rid/priority', { rid });
	const { data: priorities } = useOmnichannelPriorities();
	const dispatchToastMessage = useToastMessageDispatch();

	return useMemo(() => {
		const handlePriorityChange = (priorityId: string) => async () => {
			try {
				priorityId ? await updateRoomPriority({ priorityId }) : await removeRoomPriority();
				queryClient.invalidateQueries({ queryKey: ['current-chats'] });
				queryClient.invalidateQueries({ queryKey: roomsQueryKeys.info(rid) });
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			}
		};

		const unprioritizedOption = {
			id: 'unprioritized',
			icon: PRIORITIES_CONFIG[LivechatPriorityWeight.NOT_SPECIFIED].iconName,
			iconColor: PRIORITIES_CONFIG[LivechatPriorityWeight.NOT_SPECIFIED].color,
			content: t('Unprioritized'),
			onClick: handlePriorityChange(''),
		};

		const options = priorities.map(({ _id: priorityId, name, i18n, dirty, sortItem }) => {
			const label = dirty && name ? name : t(i18n);

			return {
				id: priorityId,
				icon: PRIORITIES_CONFIG[sortItem].iconName,
				iconColor: PRIORITIES_CONFIG[sortItem].color,
				content: label,
				onClick: handlePriorityChange(priorityId),
			};
		});

		return priorities.length ? [unprioritizedOption, ...options] : [];
	}, [t, priorities, updateRoomPriority, removeRoomPriority, queryClient, rid, dispatchToastMessage]);
};
