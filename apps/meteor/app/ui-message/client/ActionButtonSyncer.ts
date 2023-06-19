import { Meteor } from 'meteor/meteor';
import type { IUIActionButton } from '@rocket.chat/apps-engine/definition/ui';
import { UIActionButtonContext } from '@rocket.chat/apps-engine/definition/ui';

import * as TabBar from './actionButtons/tabbar';
import * as MessageAction from './actionButtons/messageAction';
import * as MessageBox from './actionButtons/messageBox';
import * as DropdownAction from './actionButtons/dropdownAction';
import { sdk } from '../../utils/client/lib/SDKClient';

let registeredButtons: Array<IUIActionButton> = [];

const addButton = async (button: IUIActionButton): Promise<void> => {
	switch (button.context) {
		case UIActionButtonContext.MESSAGE_ACTION:
			MessageAction.onAdded(button);
			break;
		case UIActionButtonContext.ROOM_ACTION:
			TabBar.onAdded(button);
			break;
		case UIActionButtonContext.MESSAGE_BOX_ACTION:
			MessageBox.onAdded(button);
			break;
		case UIActionButtonContext.USER_DROPDOWN_ACTION:
			await DropdownAction.onAdded(button);
			break;
	}

	registeredButtons.push(Object.freeze(button));
};

const removeButton = async (button: IUIActionButton): Promise<void> => {
	switch (button.context) {
		case UIActionButtonContext.MESSAGE_ACTION:
			MessageAction.onRemoved(button);
			break;
		case UIActionButtonContext.ROOM_ACTION:
			TabBar.onRemoved(button);
			break;
		case UIActionButtonContext.MESSAGE_BOX_ACTION:
			MessageBox.onRemoved(button);
			break;
		case UIActionButtonContext.USER_DROPDOWN_ACTION:
			await DropdownAction.onRemoved(button);
			break;
	}
};

export const loadButtons = (): Promise<void> =>
	sdk.rest.get('/apps/actionButtons').then((value) => {
		registeredButtons.forEach((button) => removeButton(button));
		registeredButtons = [];
		value.map(addButton);
	});

Meteor.startup(() => loadButtons());
