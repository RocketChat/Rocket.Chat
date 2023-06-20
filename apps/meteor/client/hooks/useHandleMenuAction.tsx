import { useMutableCallback } from '@rocket.chat/fuselage-hooks';

import type { Item } from '../sidebar/header/actions/hooks/useGroupingListItems';

export const useHandleMenuAction = (items: Item[]) => {
	return useMutableCallback((id) => {
		const item = items.find((item) => item.id === id);
		item?.onClick && item.onClick();
	});
};
