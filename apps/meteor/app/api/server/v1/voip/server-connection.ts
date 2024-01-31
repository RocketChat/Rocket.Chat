import { Voip } from '@rocket.chat/core-services';
import { isVoipCallServerCheckConnectionProps, isVoipManagementServerCheckConnectionProps } from '@rocket.chat/rest-typings';

import { API } from '../../api';

API.v1.addRoute(
	'voip/managementServer/checkConnection',
	{
		authRequired: true,
		permissionsRequired: ['manage-voip-contact-center-settings'],
		validateParams: isVoipManagementServerCheckConnectionProps,
	},
	{
		async get() {
			const { host, port, username, password } = this.queryParams;
			return API.v1.success(await Voip.checkManagementConnection(host, port, username, password));
		},
	},
);

API.v1.addRoute(
	'voip/callServer/checkConnection',
	{
		authRequired: true,
		permissionsRequired: ['manage-voip-contact-center-settings'],
		validateParams: isVoipCallServerCheckConnectionProps,
	},
	{
		async get() {
			const { websocketUrl, host, port, path } = this.queryParams;
			if (!websocketUrl && !(host && port && path)) {
				return API.v1.failure('Incorrect / Insufficient Parameters');
			}
			let socketUrl = websocketUrl as string;
			if (!socketUrl) {
				// We will assume that it is always secure.
				// This is because you can not have webRTC working with non-secure server.
				// It works on non-secure server if it is tested on localhost.
				if (parseInt(port as string) !== 443) {
					socketUrl = `wss://${host}:${port}/${(path as string).replace('/', '')}`;
				} else {
					socketUrl = `wss://${host}/${(path as string).replace('/', '')}`;
				}
			}

			return API.v1.success(await Voip.checkCallserverConnection(socketUrl));
		},
	},
);
