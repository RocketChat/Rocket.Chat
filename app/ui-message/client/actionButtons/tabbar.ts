import { IUIActionButton } from '@rocket.chat/apps-engine/definition/ui';

import { addAction, deleteAction, ToolboxActionConfig } from '../../../../client/views/room/lib/Toolbox';
import { applyButtonFilters } from './lib/applyButtonFilters';

const getIdForActionButton = ({ appId, actionId }: IUIActionButton): string => `${ appId }/${ actionId }`;

// eslint-disable-next-line no-void
export const onAdded = (button: IUIActionButton): void => void addAction(getIdForActionButton(button), ({ room }) => (applyButtonFilters(button, room) ? {
	id: button.actionId,
	icon: 'arrow-down',
	title: button.nameI18n as any,
	// Introduce a mapper from Apps-engine's RoomTypes to these
	// Determine what 'group' and 'team' are
	groups: button.when?.roomTypes as ToolboxActionConfig['groups'] || ['group', 'channel', 'live', 'team', 'direct', 'direct_multiple'],
} : null));

export const onRemoved = (button: IUIActionButton): boolean => deleteAction(getIdForActionButton(button));
