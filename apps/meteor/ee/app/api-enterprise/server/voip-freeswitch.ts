import { VoipFreeSwitch } from '@rocket.chat/core-services';
import type { FreeSwitchExtension } from '@rocket.chat/core-typings';
import { wrapExceptions } from '@rocket.chat/tools';

import { API } from '../../../../app/api/server';

declare module '@rocket.chat/rest-typings' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface Endpoints {
		'/v1/voip-freeswitch.extension.list': {
			GET: () => { extensions: FreeSwitchExtension[] };
		};
		'/v1/voip-freeswitch.extension.getDetails': {
			GET: (params: { extension: string; group?: string }) => FreeSwitchExtension;
		};
	}
}

API.v1.addRoute(
	'voip-freeswitch.extension.list',
	{ authRequired: true, permissionsRequired: ['manage-voip-call-settings'] },
	{
		async get() {
			const extensions = await wrapExceptions(() => VoipFreeSwitch.getExtensionList()).catch(() => {
				throw new Error('Failed to load extension list.');
			});

			return API.v1.success({ extensions });
		},
	},
);

API.v1.addRoute(
	'voip-freeswitch.extension.getDetails',
	{ authRequired: true, permissionsRequired: ['manage-voip-call-settings'] },
	{
		async get() {
			const { extension, group } = this.queryParams;

			if (!extension) {
				throw new Error('Invalid params');
			}

			const extensionData = await wrapExceptions(() => VoipFreeSwitch.getExtensionDetails({ extension, group })).suppress(() => undefined);
			if (!extensionData) {
				return API.v1.notFound();
			}

			return API.v1.success(extensionData);
		},
	},
);
