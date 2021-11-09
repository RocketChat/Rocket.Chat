import { IUIActionButton } from '@rocket.chat/apps-engine/definition/ui';

import { addAction, deleteAction } from '../../../../client/views/room/lib/Toolbox';

const getIdForActionButton = ({ appId, actionId }: IUIActionButton): string => `${ appId }/${ actionId }`;

// eslint-disable-next-line no-void
export const onAdded = (button: IUIActionButton): void => void addAction(getIdForActionButton(button), {
	id: button.actionId,
	icon: '',
	title: button.nameI18n as any,
	// Introduce a mapper from Apps-engine's RoomTypes to these
	// Determine what 'group' and 'team' are
	groups: ['group', 'channel', 'live', 'team', 'direct', 'direct_multiple'],
});

export const onRemoved = (button: IUIActionButton): boolean => deleteAction(getIdForActionButton(button));
