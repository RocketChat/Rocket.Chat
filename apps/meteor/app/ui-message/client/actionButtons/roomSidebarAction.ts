import { IUIActionButton } from '@rocket.chat/apps-engine/definition/ui';

import { SidebarRoomAction } from '../../../ui-utils/client/lib/SidebarRoomAction';

// import { AccountBox } from '../../../ui-utils/client/lib/AccountBox';

export const onAdded = async (button: IUIActionButton): Promise<void> => {
	const { appId, actionId, labelI18n, context } = button;
	await SidebarRoomAction.addItem({
		...button,
		appId,
		actionId,
		labelI18n,
		context,
	});
};
export const onRemoved = async (button: IUIActionButton): Promise<void> => {
	console.log(button);
	// const { appId, actionId, labelI18n, context } = button;
	// SidebarRoomAction.addItem()
};
