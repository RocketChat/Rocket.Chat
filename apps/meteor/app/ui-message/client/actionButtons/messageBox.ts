import { Session } from 'meteor/session';
import type { IUIActionButton } from '@rocket.chat/apps-engine/definition/ui';

import { Rooms } from '../../../models/client';
import { messageBox } from '../../../ui-utils/client';
import { applyButtonFilters } from './lib/applyButtonFilters';
import { triggerActionButtonAction } from '../ActionManager';
import { t } from '../../../utils/client';
import { Utilities } from '../../../apps/lib/misc/Utilities';

const getIdForActionButton = ({ appId, actionId }: IUIActionButton): string => `${appId}/${actionId}`;

const APP_GROUP = 'Create_new';

export const onAdded = (button: IUIActionButton): void =>
	// eslint-disable-next-line no-void
	void messageBox.actions.add(APP_GROUP, t(Utilities.getI18nKeyForApp(button.labelI18n, button.appId)), {
		id: getIdForActionButton(button),
		// icon: button.icon || '',
		condition() {
			return applyButtonFilters(button, Rooms.findOne(Session.get('openedRoom')));
		},
		action() {
			triggerActionButtonAction({
				rid: Session.get('openedRoom'),
				actionId: button.actionId,
				appId: button.appId,
				payload: { context: button.context },
			});
		},
	});

export const onRemoved = (button: IUIActionButton): void =>
	// eslint-disable-next-line no-void
	void messageBox.actions.remove(APP_GROUP, new RegExp(getIdForActionButton(button)));
