import { AppManager } from '@rocket.chat/apps-engine/server/AppManager';

import { API } from '../../../../api/server';
import { AppsRestApi } from '../rest';

export const actionButtonsHandler = (apiManager: AppsRestApi): [Record<string, any>, Record<string, Function>] => [
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
];
