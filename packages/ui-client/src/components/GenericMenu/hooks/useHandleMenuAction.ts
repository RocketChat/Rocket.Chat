import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import type { Key } from 'react';

import type { GenericMenuItemProps } from '../GenericMenuItem';

export const useHandleMenuAction = (items: GenericMenuItemProps[], callbackAction?: () => void) =>
	useStableCallback((id: Key) => {
		const item = items.find((item) => item.id === id && !!item.onClick);
		if (item) {
			item.onClick?.();
			callbackAction?.();
		}
	});
