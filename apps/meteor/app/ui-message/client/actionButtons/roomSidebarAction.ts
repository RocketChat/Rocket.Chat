import type { IUIActionButton } from '@rocket.chat/apps-engine/definition/ui';

import { SidebarRoomAction } from '../../../ui-utils/client/lib/SidebarRoomAction';

export const onAdded = async (button: IUIActionButton): Promise<void> => {
	SidebarRoomAction.actions.addItem(button);
};
export const onRemoved = async (button: IUIActionButton): Promise<void> => {
	SidebarRoomAction.actions.removeItem(button);
};
