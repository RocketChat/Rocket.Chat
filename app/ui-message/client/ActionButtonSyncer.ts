import { Meteor } from 'meteor/meteor';
import { IUIActionButton, MessageActionContext, TemporaryRoomTypeFilter, UIActionButtonContext } from '@rocket.chat/apps-engine/definition/ui';

import { APIClient } from '../../utils/client';
import * as TabBar from './actionButtons/tabbar';
import * as MessageAction from './actionButtons/messageAction';
import * as MessageBox from './actionButtons/messageBox';

let registeredButtons: Array<IUIActionButton> = [];

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const mockButtons = () => ([
	{
		context: UIActionButtonContext.MESSAGE_ACTION,
		icon: 'tab',
		actionId: 'messageaction',
		appId: 'mock-app-1',
		nameI18n: 'test-i18n',
		when: {
			messageActionContext: [MessageActionContext.MESSAGE],
			roomTypes: [TemporaryRoomTypeFilter.CHANNEL, TemporaryRoomTypeFilter.GROUP],
			hasOnePermission: ['view-all-teams'],
			hasAllRoles: ['admin', 'moderator'],
		},
	},
	{
		context: UIActionButtonContext.MESSAGE_BOX_ACTION,
		icon: 'tab',
		actionId: 'messagebox',
		appId: 'mock-app-1',
		nameI18n: 'test-i18n',
		when: {
			roomTypes: [TemporaryRoomTypeFilter.DIRECT, TemporaryRoomTypeFilter.DIRECT_MULTIPLE],
			hasAllPermissions: ['create-team', 'create-invite-links'],
			hasOneRole: ['user', 'admin'],
		},
	},
	{
		context: UIActionButtonContext.ROOM_ACTION,
		icon: 'tab',
		actionId: 'room',
		appId: 'mock-app-3',
		nameI18n: 'test-i18n',
		when: {
			roomTypes: [TemporaryRoomTypeFilter.TEAM, TemporaryRoomTypeFilter.LIVE_CHAT],
			hasOnePermission: ['view-all-teams'],
			hasAllRoles: ['admin'],
		},
	},
// eslint-disable-next-line @typescript-eslint/no-use-before-define
] as Array<IUIActionButton>).map(addButton);

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
	}
};

export const loadButtons = (): Promise<void> => APIClient.get('apps/actionButtons')
	.then((value: Array<IUIActionButton>) => {
		registeredButtons.forEach((button) => removeButton(button));
		registeredButtons = [];
		value.map(addButton);
		return registeredButtons;
	})
	.then(console.log)
	.catch(console.error);

/**
  * Returns an iterator so we preserve the original Array
  * without needing to copy it
  */
export const getActionButtonsIterator = (filter?: (value: IUIActionButton) => boolean): IterableIterator<IUIActionButton> => {
	let index = 0;

	return {
		next(): IteratorResult<IUIActionButton> {
			let value;
			do {
				if (index >= registeredButtons.length) {
					return { done: true, value: undefined };
				}

				value = registeredButtons[index++];
			} while (filter && !filter(value));

			return { done: false, value };
		},
		[Symbol.iterator](): IterableIterator<IUIActionButton> {
			return this;
		},
	};
};

// @ts-ignore
window.resetButtons = (): Promise<void> => loadButtons().then(() => console.log('load buttons finished')).then(mockButtons);

// @ts-ignore
Meteor.startup(window.resetButtons);
