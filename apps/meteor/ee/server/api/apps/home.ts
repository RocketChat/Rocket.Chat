import { AppEvents } from '@rocket.chat/apps';
import {
	isAppsHomeOpenProps,
	validateAppsHomeOpenSuccessResponse,
	validateBadRequestErrorResponse,
	validateNotFoundErrorResponse,
	validateUnauthorizedErrorResponse,
} from '@rocket.chat/rest-typings';

import type { ExtractRoutesFromAPI } from '../../../../server/api/ApiClass';
import { API } from '../../../../server/api/api';
import { openAppHome } from '../../../../server/lib/uikit/openAppHome';
import { Apps } from '../../lib/apps/orchestrator';

const appsHomeEndpoints = API.v1.post(
	'apps.home.open',
	{
		authRequired: true,
		body: isAppsHomeOpenProps,
		response: {
			200: validateAppsHomeOpenSuccessResponse,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
			404: validateNotFoundErrorResponse,
		},
	},
	async function action() {
		const { appId } = this.bodyParams;

		if (!Apps.isLoaded() || !Apps.getManager()?.getOneById(appId)) {
			return API.v1.notFound('error-app-not-found');
		}

		const user = Apps.getConverters()?.get('users').convertToApp(this.user);

		const view = await openAppHome(appId, this.userId, (triggerId, view) =>
			Apps.triggerEvent(AppEvents.IUIKitInteractionHandler, {
				type: 'appHomeOpened',
				appId,
				triggerId,
				user,
				payload: { view },
			}),
		);

		return API.v1.success(view ? { view } : {});
	},
);

export type AppsHomeEndpoints = ExtractRoutesFromAPI<typeof appsHomeEndpoints>;

declare module '@rocket.chat/rest-typings' {
	// oxlint-disable-next-line @typescript-eslint/no-empty-interface, @typescript-eslint/no-empty-object-type
	interface Endpoints extends AppsHomeEndpoints {}
}
