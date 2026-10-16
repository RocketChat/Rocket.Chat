import type { RoomType } from '@rocket.chat/core-typings';
import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useFilterModals } from '../../sidebar/SidebarRail/filters/hooks/useFilterModals';
import { useSidebarFiltersEnabled } from '../../sidebar/SidebarRail/filters/hooks/useSidebarFiltersEnabled';

export const useSubscriptionLabelsMenuItem = ({ rid, type }: { rid: string; type: RoomType }): GenericMenuItemProps | undefined => {
	const { t } = useTranslation();
	const enabled = useSidebarFiltersEnabled();
	const { openSubscriptionLabels } = useFilterModals();

	return useMemo(() => {
		if (!enabled || type === 'l') {
			return undefined;
		}

		return {
			id: 'subscriptionLabels',
			icon: 'tag',
			content: t('Labels'),
			onClick: () => openSubscriptionLabels(rid),
		};
	}, [enabled, openSubscriptionLabels, rid, t, type]);
};
