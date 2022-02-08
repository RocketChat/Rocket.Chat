import { Match, check } from 'meteor/check';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';

import { API } from '../../api';
import { hasPermission } from '../../../../authorization/server';
import { Voip } from '../../../../../server/sdk';
import { ServerType } from '../../../../../definition/IVoipServerConfig';

// management api(s)
API.v1.addRoute(
	'voipServerConfig.management',
	{ authRequired: true },
	{
		async get() {
			if (!hasPermission(this.userId, 'manage-voip-contact-center-settings')) {
				return API.v1.unauthorized(TAPi18n.__('error-insufficient-permission', { permission: 'manage-voip-contact-center-settings' }));
			}

			const config = await Voip.getServerConfigData(ServerType.MANAGEMENT);

			if (!config) {
				return API.v1.notFound();
			}

			return API.v1.success({ ...config });
		},
		// NOTE: you can use this POST endpoint for both create and update operation
		async post() {
			check(
				this.bodyParams,
				Match.ObjectIncluding({
					host: String,
					port: Number,
					serverName: String,
					username: String,
					password: String,
				}),
			);

			if (!hasPermission(this.userId, 'manage-voip-contact-center-settings')) {
				return API.v1.unauthorized(TAPi18n.__('error-insufficient-permission', { permission: 'manage-voip-contact-center-settings' }));
			}
			const { host, port, serverName, username, password } = this.bodyParams;

			await Voip.addServerConfigData({
				type: ServerType.MANAGEMENT,
				host,
				name: serverName,
				active: true,
				configData: {
					port,
					username,
					password,
				},
			});

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'voipServerConfig.management.checkconnection',
	{ authRequired: true },
	{
		async get() {
			if (!hasPermission(this.userId, 'manage-voip-contact-center-settings')) {
				return API.v1.unauthorized(TAPi18n.__('error-insufficient-permission', { permission: 'manage-voip-contact-center-settings' }));
			}
			check(
				this.requestParams(),
				Match.ObjectIncluding({
					host: String,
					port: String,
					username: String,
					password: String,
				}),
			);
			const { host, port, username, password } = this.requestParams();
			return API.v1.success(await Voip.checkManagementConnection(host, port, username, password));
		},
	},
);

API.v1.addRoute(
	'voipServerConfig.callserver.checkconnection',
	{ authRequired: true },
	{
		async get() {
			if (!hasPermission(this.userId, 'manage-voip-contact-center-settings')) {
				return API.v1.unauthorized(TAPi18n.__('error-insufficient-permission', { permission: 'manage-voip-contact-center-settings' }));
			}
			check(
				this.requestParams(),
				Match.ObjectIncluding({
					websocketUrl: Match.Maybe(String),
					host: Match.Maybe(String),
					port: Match.Maybe(String),
					path: Match.Maybe(String),
				}),
			);
			const { websocketUrl, host, port, path } = this.requestParams();
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
			try {
				return API.v1.success(await Voip.checkCallserverConnection(socketUrl));
			} catch (error: any) {
				return API.v1.failure(error.message);
			}
		},
	},
);

// call-server api(s)
API.v1.addRoute(
	'voipServerConfig.callServer',
	{ authRequired: true },
	{
		async get() {
			if (!hasPermission(this.userId, 'manage-voip-call-settings')) {
				return API.v1.unauthorized(TAPi18n.__('error-insufficient-permission', { permission: 'manage-voip-call-settings' }));
			}

			const config = await Voip.getServerConfigData(ServerType.CALL_SERVER);
			if (!config) {
				return API.v1.notFound();
			}

			return API.v1.success({ ...config });
		},
		// NOTE: you can use this POST endpoint for both create and update operation
		async post() {
			check(
				this.bodyParams,
				Match.ObjectIncluding({
					host: String,
					serverName: String,
					websocketPort: Number,
					websocketPath: String,
				}),
			);

			if (!hasPermission(this.userId, 'manage-voip-call-settings')) {
				return API.v1.unauthorized(TAPi18n.__('error-insufficient-permission', { permission: 'manage-voip-call-settings' }));
			}

			const { host, websocketPort, websocketPath, serverName } = this.bodyParams;

			await Voip.addServerConfigData({
				type: ServerType.CALL_SERVER,
				host,
				name: serverName,
				active: true,
				configData: {
					websocketPort,
					websocketPath,
				},
			});
			return API.v1.success();
		},
	},
);
