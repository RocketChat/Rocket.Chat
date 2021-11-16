import { IUIActionButton } from '@rocket.chat/apps-engine/definition/ui';

import { MessageAction } from '../../../ui-utils/client';
import { applyButtonFilters } from './lib/applyButtonFilters';

const getIdForActionButton = ({ appId, actionId }: IUIActionButton): string => `${ appId }/${ actionId }`;

// eslint-disable-next-line no-void
export const onAdded = (button: IUIActionButton): void => void MessageAction.addButton({
	id: getIdForActionButton(button),
	icon: 'arrow-loop',
	label: button.nameI18n,
	context: button.when?.messageActionContext || ['message', 'message-mobile', 'threads', 'starred'],
	condition({ room }: any) {
		return applyButtonFilters(button, room);
	},
	async action() {
		console.log('Not implemented');
	},
});

export const onRemoved = (button: IUIActionButton): void => MessageAction.removeButton(getIdForActionButton(button));
