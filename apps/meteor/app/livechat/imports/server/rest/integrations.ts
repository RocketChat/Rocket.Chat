import { API } from '../../../../api/server';
import { findIntegrationSettings } from '../../../server/api/lib/integrations';
import { newIntegratorMessage } from '../../../server/lib/integrator';

API.v1.addRoute(
	'livechat/integrations.settings',
	{ authRequired: true, permissionsRequired: ['view-livechat-manager'] },
	{
		async get() {
			return API.v1.success(await findIntegrationSettings());
		},
	},
);

API.v1.addRoute('livechat/integrations.send', {
	async post() {
		console.log((this as any).bodyParams);

		const appId = 'get-app-id';
		const appName = 'get-app-name';

		const { visitorWaId, contactWaId } = (this as any).bodyParams;

		const source = {
			type: 'app',
			id: appId,
			alias: appName,
			// ...(source &&
			// 	source.type === 'app' && {
			// 		sidebarIcon: source.sidebarIcon,
			// 		defaultIcon: source.defaultIcon,
			// 		label: source.label,
			// 		destination: source.destination,
			// 	}),
		};

		const result = await newIntegratorMessage({
			...(this as any).bodyParams,
			source,
			roomCustomFields: {
				whatsAppMessage: { visitorWaId, contactWaId },
			},
		});

		return API.v1.success({ result });
	},
});
