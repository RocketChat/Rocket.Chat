import { LivechatPriorityWeight } from '@rocket.chat/core-typings';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useOmnichannelPriorities } from './useOmnichannelPriorities';
import { dispatchToastMessage } from '../../lib/toast';
import { PRIORITY_ICONS } from '../priorities/PriorityIcon';

export const useOmnichannelPrioritiesMenu = (rid: string) => {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const updateRoomPriority = useEndpoint('POST', '/v1/livechat/room/:rid/priority', { rid });
	const removeRoomPriority = useEndpoint('DELETE', '/v1/livechat/room/:rid/priority', { rid });
	const { data: priorities } = useOmnichannelPriorities();

	const handlePriorityChange = useEffectEvent((priorityId: string) => async () => {
		try {
			priorityId ? await updateRoomPriority({ priorityId }) : await removeRoomPriority();
			queryClient.invalidateQueries({
				queryKey: ['current-chats'],
			});
			queryClient.invalidateQueries({
				queryKey: ['/v1/rooms.info', rid],
			});
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	});

	return useMemo(() => {
		const unprioritizedOption = {
			id: 'unprioritized',
			icon: PRIORITY_ICONS[LivechatPriorityWeight.NOT_SPECIFIED].iconName,
			iconColor: PRIORITY_ICONS[LivechatPriorityWeight.NOT_SPECIFIED].color,
			content: t('Unprioritized'),
			onClick: handlePriorityChange(''),
		};

		const options = priorities.map(({ _id: priorityId, name, i18n, dirty, sortItem }) => {
			const label = dirty && name ? name : i18n;

			return {
				id: priorityId,
				icon: PRIORITY_ICONS[sortItem].iconName,
				iconColor: PRIORITY_ICONS[sortItem].color,
				content: label,
				onClick: handlePriorityChange(priorityId),
			};
		});

		return priorities.length ? [unprioritizedOption, ...options] : [];
	}, [t, handlePriorityChange, priorities]);
};
