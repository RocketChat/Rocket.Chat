import { Match, check } from 'meteor/check';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';

import { API } from '../../api';
import { hasPermission } from '../../../../authorization/server';
import { Voip } from '../../../../../server/sdk';
import { ICallServerConfigData, IManagementConfigData, ServerType } from '../../../../../definition/IVoipServerConfig';

// management api(s)
API.v1.addRoute('voipServerConfig.management', { authRequired: true }, {
	get() {
		if (!hasPermission(this.userId, 'manage-voip-contact-center-settings')) {
			return API.v1.unauthorized(TAPi18n._('error-insufficient-permission', { permission: 'manage-voip-contact-center-settings' }));
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
			return API.v1.unauthorized(TAPi18n._('error-insufficient-permission', { permission: 'manage-voip-contact-center-settings' }));
		}

		const { host, port, serverName, username, password } = this.bodyParams;

		Promise.await(Voip.deactivateServerConfigDataIfAvailable(ServerType.MANAGEMENT));

		Promise.await(Voip.addServerConfigData({
			type: ServerType.MANAGEMENT,
			host,
			serverName,
			configActive: true,
			configData: {
				port,
				username,
				password,
			} as IManagementConfigData,
		}));

		return API.v1.success();
	},
});

// call-server api(s)
API.v1.addRoute('voipServerConfig.callServer', { authRequired: true }, {
	get() {
		if (!hasPermission(this.userId, 'manage-voip-call-settings')) {
			return API.v1.unauthorized(TAPi18n._('error-insufficient-permission', { permission: 'manage-voip-call-settings' }));
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
			serverName: String,
			websocketPort: Number,
			websocketPath: String,
		}));

		if (!hasPermission(this.userId, 'manage-voip-call-settings')) {
			return API.v1.unauthorized(TAPi18n._('error-insufficient-permission', { permission: 'manage-voip-call-settings' }));
		}

		const { host, websocketPort, websocketPath, serverName } = this.bodyParams;

		Promise.await(Voip.deactivateServerConfigDataIfAvailable(ServerType.CALL_SERVER));

		Promise.await(Voip.addServerConfigData({
			type: ServerType.CALL_SERVER,
			host,
			serverName,
			configActive: true,
			configData: {
				websocketPort,
				websocketPath,
			} as ICallServerConfigData,
		}));

		return API.v1.success();
	},
});
