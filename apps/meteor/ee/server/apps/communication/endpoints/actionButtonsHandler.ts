import { API } from '../../../../../app/api/server';
import type { AppsRestApi } from '../rest';

export const registerActionButtonsHandler = ({ api, _manager }: AppsRestApi) =>
	void api.addRoute(
		'actionButtons',
		{ authRequired: false },
		{
			async get() {
				const buttons = await _manager.getUIActionButtonManager().getAllActionButtons();

				return API.v1.success(buttons);
			},
		},
	);
