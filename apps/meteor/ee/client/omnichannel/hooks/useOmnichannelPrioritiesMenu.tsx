import { LivechatPriorityWeight } from '@rocket.chat/core-typings';
import type { Menu } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useEndpoint, useTranslation } from '@rocket.chat/ui-contexts';
import { useQueryClient } from '@tanstack/react-query';
import type { ComponentProps } from 'react';
import React, { useCallback, useMemo } from 'react';

import { dispatchToastMessage } from '../../../../client/lib/toast';
import { PriorityIcon } from '../priorities/PriorityIcon';
import { useOmnichannelPriorities } from './useOmnichannelPriorities';

export const useOmnichannelPrioritiesMenu = (rid: string): ComponentProps<typeof Menu>['options'] | Record<string, never> => {
	const t = useTranslation();
	const queryClient = useQueryClient();
	const updateRoomPriority = useEndpoint('POST', '/v1/livechat/room/:rid/priority', { rid });
	const removeRoomPriority = useEndpoint('DELETE', '/v1/livechat/room/:rid/priority', { rid });
	const { data: priorities } = useOmnichannelPriorities();

	const handlePriorityChange = useMutableCallback((priorityId: string) => async () => {
		try {
			priorityId ? await updateRoomPriority({ priorityId }) : await removeRoomPriority();
			queryClient.invalidateQueries(['current-chats']);
			queryClient.invalidateQueries(['/v1/rooms.info', rid]);
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	});

	const renderOption = useCallback((label: string, weight: LivechatPriorityWeight) => {
		return (
			<>
				<PriorityIcon level={weight || LivechatPriorityWeight.NOT_SPECIFIED} showUnprioritized /> {label}
			</>
		);
	}, []);

	return useMemo<ComponentProps<typeof Menu>['options']>(() => {
		const menuHeading = {
			type: 'heading',
			label: t('Priorities'),
		};

		const unprioritizedOption = {
			type: 'option',
			action: handlePriorityChange(''),
			label: {
				label: renderOption(t('Unprioritized'), LivechatPriorityWeight.NOT_SPECIFIED),
			},
		};

		const options = priorities.reduce<Record<string, object>>((items, { _id: priorityId, name, i18n, dirty, sortItem }) => {
			const label = dirty && name ? name : i18n;

			items[label] = {
				action: handlePriorityChange(priorityId),
				label: {
					label: renderOption(label, sortItem),
				},
			};

			return items;
		}, {});

		return priorities.length ? { menuHeading, Unprioritized: unprioritizedOption, ...options } : {};
	}, [t, handlePriorityChange, priorities, renderOption]);
};
