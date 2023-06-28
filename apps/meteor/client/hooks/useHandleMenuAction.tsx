import { useMutableCallback } from '@rocket.chat/fuselage-hooks';

import type { GenericMenuItemProps } from '../components/GenericMenuItem';

export const useHandleMenuAction = (items: GenericMenuItemProps[]) => {
	return useMutableCallback((id) => {
		const item = items.find((item) => item.id === id);
		item?.onClick && item.onClick();
	});
};
