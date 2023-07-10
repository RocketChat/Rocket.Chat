import type { IUIActionButton } from '@rocket.chat/apps-engine/definition/ui';
import { UIActionButtonContext } from '@rocket.chat/apps-engine/definition/ui';

import * as TabBar from './actionButtons/tabbar';
import * as MessageAction from './actionButtons/messageAction';

export const addButton = async (button: IUIActionButton): Promise<void> => {
	switch (button.context) {
		case UIActionButtonContext.MESSAGE_ACTION:
			MessageAction.onAdded(button);
			break;
		case UIActionButtonContext.ROOM_ACTION:
			TabBar.onAdded(button);
			break;
	}
};

export const removeButton = async (button: IUIActionButton): Promise<void> => {
	switch (button.context) {
		case UIActionButtonContext.MESSAGE_ACTION:
			MessageAction.onRemoved(button);
			break;
		case UIActionButtonContext.ROOM_ACTION:
			TabBar.onRemoved(button);
			break;
	}
};
