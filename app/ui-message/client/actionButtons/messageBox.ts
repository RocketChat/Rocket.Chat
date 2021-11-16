import { Session } from 'meteor/session';
import { IUIActionButton } from '@rocket.chat/apps-engine/definition/ui';

import { Rooms } from '../../../models/client';
import { messageBox } from '../../../ui-utils/client';
import { applyButtonFilters } from './lib/applyButtonFilters';

const getIdForActionButton = ({ appId, actionId }: IUIActionButton): string => `${ appId }/${ actionId }`;

const APP_GROUP = 'Create_new';

// eslint-disable-next-line no-void
export const onAdded = (button: IUIActionButton): void => void messageBox.actions.add(APP_GROUP, button.nameI18n, {
	id: getIdForActionButton(button),
	icon: 'arrow-back',
	condition() {
		return applyButtonFilters(button, Rooms.findOne(Session.get('openedRoom')));
	},
	action() {
		console.log('Not implemented');
	},
});

// eslint-disable-next-line no-void
export const onRemoved = (button: IUIActionButton): void => void messageBox.actions.remove(APP_GROUP, new RegExp(getIdForActionButton(button)));
