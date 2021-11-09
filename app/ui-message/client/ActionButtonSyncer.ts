import { Meteor } from 'meteor/meteor';
import { IUIActionButton, UIActionButtonContext } from '@rocket.chat/apps-engine/definition/ui';

import { APIClient } from '../../utils/client';
import * as TabBar from './actionButtons/tabbar';

let registeredButtons: Array<IUIActionButton>;

export const addButton = (button: IUIActionButton): void => {
	switch (button.context) {
		case UIActionButtonContext.MESSAGE_ACTION:
			// onMessageActionAdded(button);
			break;
		case UIActionButtonContext.ROOM_ACTION:
			TabBar.onAdded(button);
			break;
	}

	registeredButtons.push(Object.freeze(button));
};

export const removeButton = (button: IUIActionButton): void => {
	switch (button.context) {
		case UIActionButtonContext.ROOM_ACTION:
			TabBar.onRemoved(button);
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

Meteor.startup(() => loadButtons());
