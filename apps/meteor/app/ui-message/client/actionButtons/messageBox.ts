import type { IUIActionButton } from '@rocket.chat/apps-engine/definition/ui';
import type { TranslationKey } from '@rocket.chat/ui-contexts';

import { Rooms } from '../../../models/client';
import { messageBox } from '../../../ui-utils/client';
import { applyButtonFilters } from './lib/applyButtonFilters';
import { triggerActionButtonAction } from '../ActionManager';
import { t } from '../../../utils/client';
import { Utilities } from '../../../../ee/lib/misc/Utilities';
import { RoomManager } from '../../../../client/lib/RoomManager';
import { asReactiveSource } from '../../../../client/lib/tracker';

const getIdForActionButton = ({ appId, actionId }: IUIActionButton): string => `${appId}/${actionId}`;

export const onAdded = (button: IUIActionButton): void =>
	// eslint-disable-next-line no-void
	void messageBox.actions.add('Apps', t(Utilities.getI18nKeyForApp(button.labelI18n, button.appId)) as TranslationKey, {
		id: getIdForActionButton(button),
		// icon: button.icon || '',
		condition() {
			return applyButtonFilters(
				button,
				Rooms.findOne(
					asReactiveSource(
						(cb) => RoomManager.on('changed', cb),
						() => RoomManager.opened,
					),
				),
			);
		},
		action() {
			void triggerActionButtonAction({
				rid: RoomManager.opened,
				actionId: button.actionId,
				appId: button.appId,
				payload: { context: button.context },
			});
		},
	});

export const onRemoved = (button: IUIActionButton): void =>
	// eslint-disable-next-line no-void
	void messageBox.actions.remove('Apps', new RegExp(getIdForActionButton(button)));
