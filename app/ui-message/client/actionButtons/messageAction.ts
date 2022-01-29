import { IUIActionButton } from '@rocket.chat/apps-engine/definition/ui';

import { Utilities } from '../../../apps/lib/misc/Utilities';
import { MessageAction, messageArgs } from '../../../ui-utils/client';
import { t } from '../../../utils/client';
import { triggerActionButtonAction } from '../ActionManager';
import { applyButtonFilters } from './lib/applyButtonFilters';

const getIdForActionButton = ({ appId, actionId }: IUIActionButton): string => `${appId}/${actionId}`;

export const onAdded = (button: IUIActionButton): void =>
	// eslint-disable-next-line no-void
	void MessageAction.addButton({
		id: getIdForActionButton(button),
		// icon: button.icon || '',
		label: t(Utilities.getI18nKeyForApp(button.labelI18n, button.appId)),
		context: button.when?.messageActionContext || ['message', 'message-mobile', 'threads', 'starred'],
		condition({ room }: any) {
			return applyButtonFilters(button, room);
		},
		async action() {
			const { msg } = messageArgs(this);
			triggerActionButtonAction({
				rid: msg.rid,
				mid: msg._id,
				actionId: button.actionId,
				appId: button.appId,
				payload: { context: button.context },
			});
		},
	});

export const onRemoved = (button: IUIActionButton): void => MessageAction.removeButton(getIdForActionButton(button));
