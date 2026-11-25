import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import type { Key } from 'react';

import type { GenericMenuItemProps } from '../GenericMenuItem';

const findActionItem = (items: GenericMenuItemProps[], id: Key): GenericMenuItemProps | undefined =>
	items.flatMap((item) => [item, ...(item.items ?? [])]).find((item) => item.id === id && !!item.onClick && !item.items?.length);

export const useHandleMenuAction = (items: GenericMenuItemProps[], callbackAction?: () => void) =>
	useStableCallback((id: Key) => {
		const item = findActionItem(items, id);
		if (item) {
			item.onClick?.();
			callbackAction?.();
		}
	});
