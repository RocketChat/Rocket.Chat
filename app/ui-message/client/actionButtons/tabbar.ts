import { IUIActionButton } from '@rocket.chat/apps-engine/definition/ui';

import { addAction, deleteAction } from '../../../../client/views/room/lib/Toolbox';
import { applyButtonFilters } from './lib/applyButtonFilters';

const getIdForActionButton = ({ appId, actionId }: IUIActionButton): string => `${ appId }/${ actionId }`;

// eslint-disable-next-line no-void
export const onAdded = (button: IUIActionButton): void => void addAction(getIdForActionButton(button), ({ room }) => (applyButtonFilters(button, room) ? {
	id: button.actionId,
	icon: 'arrow-down',
	title: button.nameI18n as any,
	// Filters were applied in the applyButtonFilters function
	// if the code made it this far, the button should be shown
	groups: ['group', 'channel', 'live', 'team', 'direct', 'direct_multiple'],
} : null));

export const onRemoved = (button: IUIActionButton): boolean => deleteAction(getIdForActionButton(button));
