import { AppsManager } from '@rocket.chat/core-services';

import { API } from '../../../../api/server';

export const actionButtonsHandler = () =>
	[
		{
			authRequired: false,
		},
		{
			get(): any {
				const buttons = AppsManager.getAllActionButtons();

				return API.v1.success(buttons);
			},
		},
	] as const;
