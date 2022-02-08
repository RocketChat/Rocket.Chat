import { IUIActionButton } from '@rocket.chat/apps-engine/definition/ui';

import { addAction, deleteAction } from '../../../../client/views/room/lib/Toolbox';
import { Utilities } from '../../../apps/lib/misc/Utilities';
import { t } from '../../../utils/client';
import { triggerActionButtonAction } from '../ActionManager';
import { applyButtonFilters } from './lib/applyButtonFilters';

const getIdForActionButton = ({ appId, actionId }: IUIActionButton): string => `${appId}/${actionId}`;

export const onAdded = (button: IUIActionButton): void =>
	// eslint-disable-next-line no-void
	void addAction(getIdForActionButton(button), ({ room }) =>
		applyButtonFilters(button, room)
			? {
					id: button.actionId,
					icon: '', // Apps won't provide icons for now
					order: 300, // Make sure the button only shows up inside the room toolbox
					title: t(Utilities.getI18nKeyForApp(button.labelI18n, button.appId)) as any,
					// Filters were applied in the applyButtonFilters function
					// if the code made it this far, the button should be shown
					groups: ['group', 'channel', 'live', 'team', 'direct', 'direct_multiple'],
					action: (): Promise<any> =>
						triggerActionButtonAction({
							rid: room._id,
							actionId: button.actionId,
							appId: button.appId,
							payload: { context: button.context },
						}),
			  }
			: null,
	);

export const onRemoved = (button: IUIActionButton): boolean => deleteAction(getIdForActionButton(button));
