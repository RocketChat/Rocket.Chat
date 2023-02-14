import type { AppManager } from '@rocket.chat/apps-engine/server/AppManager';

import { API } from '../../../../api/server';
import type { AppsRestApi } from '../rest';

export const actionButtonsHandler = (apiManager: AppsRestApi) =>
	[
		{
			authRequired: false,
		},
		{
			get(): any {
				const manager = apiManager._manager as AppManager;

				const buttons = manager.getUIActionButtonManager().getAllActionButtons();

				return API.v1.success(buttons);
			},
		},
	] as const;
