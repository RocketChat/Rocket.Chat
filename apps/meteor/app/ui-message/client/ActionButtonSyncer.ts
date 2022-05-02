import { Meteor } from 'meteor/meteor';
import { IUIActionButton, UIActionButtonContext } from '@rocket.chat/apps-engine/definition/ui';

import { APIClient } from '../../utils/client';
import * as TabBar from './actionButtons/tabbar';
import * as MessageAction from './actionButtons/messageAction';
import * as MessageBox from './actionButtons/messageBox';
import { AccountBox } from '../../ui-utils/client/lib/AccountBox';

let registeredButtons: Array<IUIActionButton> = [];

export const addButton = (button: IUIActionButton): void => {
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
			AccountBox.onAdded(button);
			break;
	}

	registeredButtons.push(Object.freeze(button));
};

export const removeButton = (button: IUIActionButton): void => {
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
			AccountBox.onRemoved(button);
			break;
	}
};

export const loadButtons = (): Promise<void> =>
	APIClient.get('apps/actionButtons').then((value: Array<IUIActionButton>) => {
		registeredButtons.forEach((button) => removeButton(button));
		registeredButtons = [];
		value.map(addButton);
	});

Meteor.startup(() => loadButtons());
