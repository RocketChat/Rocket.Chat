import { Match, check } from 'meteor/check';

import { API } from '../../api';
import { hasPermission } from '../../../../authorization/server';
import { Voip } from '../../../../../server/sdk';
import { ICallServerConfigData, IManagementConfigData, ServerType } from '../../../../../definition/IVoipServerConfig';

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
	// NOTE: you can use this POST endpoint for both create and update operation
	post() {
		check(this.bodyParams, Match.ObjectIncluding({
			host: String,
			port: Number,
			serverName: String,
			username: String,
			password: String,
		}));

		if (!hasPermission(this.userId, 'manage-voip-contact-center-settings')) {
			return API.v1.unauthorized('error-no-permission-manage-voip-contact-center-settings'); // TODO: create translations
		}

		const { host, port, serverName, username, password } = this.bodyParams;

		Promise.await(Voip.deleteServerConfigDataIfAvailable(ServerType.MANAGEMENT));

		const result = Promise.await(Voip.addServerConfigData({
			type: ServerType.MANAGEMENT,
			host,
			configData: {
				port,
				serverName,
				username,
				password,
			} as IManagementConfigData,
		}));

		return API.v1.success({ result });
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
	// NOTE: you can use this POST endpoint for both create and update operation
	post() {
		check(this.bodyParams, Match.ObjectIncluding({
			host: String,
			websocketPort: Number,
			websocketPath: String,
			callServerName: String,
		}));

		if (!hasPermission(this.userId, 'manage-voip-call-settings')) {
			return API.v1.unauthorized('error-no-permission-manage-voip-call-settings'); // TODO: create translations
		}

		const { host, websocketPort, websocketPath, callServerName } = this.bodyParams;

		Promise.await(Voip.deleteServerConfigDataIfAvailable(ServerType.CALL_SERVER));

		const result = Promise.await(Voip.addServerConfigData({
			type: ServerType.CALL_SERVER,
			host,
			configData: {
				websocketPort,
				websocketPath,
				callServerName,
			} as ICallServerConfigData,
		}));

		return API.v1.success({ result });
	},
});
