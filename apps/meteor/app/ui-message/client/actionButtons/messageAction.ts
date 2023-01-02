import type { IUIActionButton } from '@rocket.chat/apps-engine/definition/ui';

import { Utilities } from '../../../apps/lib/misc/Utilities';
import { MessageAction } from '../../../ui-utils/client';
import { messageArgs } from '../../../../client/lib/utils/messageArgs';
import { t } from '../../../utils/client';
import { triggerActionButtonAction } from '../ActionManager';
import { applyButtonFilters } from './lib/applyButtonFilters';

const getIdForActionButton = ({ appId, actionId }: IUIActionButton): string => `${appId}/${actionId}`;

// eslint-disable-next-line no-void
export const onAdded = (button: IUIActionButton): void =>
	MessageAction.addButton({
		id: getIdForActionButton(button),
		icon: '' as any,
		label: t(Utilities.getI18nKeyForApp(button.labelI18n, button.appId)) as any,
		context: button.when?.messageActionContext || ['message', 'message-mobile', 'threads', 'starred'],
		condition({ room }) {
			return applyButtonFilters(button, room);
		},
		action(_, props) {
			const { message = messageArgs(this).msg } = props;
			triggerActionButtonAction({
				rid: message.rid,
				mid: message._id,
				actionId: button.actionId,
				appId: button.appId,
				payload: { context: button.context },
			});
		},
	});

export const onRemoved = (button: IUIActionButton): void => MessageAction.removeButton(getIdForActionButton(button));
