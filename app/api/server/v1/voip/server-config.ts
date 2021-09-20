import { API } from '../../api';
import { hasPermission } from '../../../../authorization/server';
import { Voip } from '../../../../../server/sdk';
import { ServerType } from '../../../../../definition/IVoipServerConfig';

// management api(s)
API.v1.addRoute('voipServerConfig.management', { authRequired: true }, {
	get() {
		if (!hasPermission(this.userId, 'manage-voip-contact-center-settings')) {
			return API.v1.unauthorized('error-no-permission-manage-voip-contact-center-settings'); // TODO: create translations
		}

		const config = Promise.await(Voip.getServerConfigData(ServerType.MANAGEMENT));

		if (!config) {
			return API.v1.notFound();
		}

		return API.v1.success({ ...config });
	},
});

// call-server api(s)
API.v1.addRoute('voipServerConfig.callServer', { authRequired: true }, {
	get() {
		if (!hasPermission(this.userId, 'manage-voip-call-settings')) {
			return API.v1.unauthorized('error-no-permission-manage-voip-call-settings'); // TODO: create translations
		}

		const config = Promise.await(Voip.getServerConfigData(ServerType.CALL_SERVER));
		if (!config) {
			return API.v1.notFound();
		}

		return API.v1.success({ ...config });
	},
});
