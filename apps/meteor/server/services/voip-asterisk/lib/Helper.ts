import type { IVoipManagementServerConfig, IVoipCallServerConfig } from '@rocket.chat/core-typings';
import { ServerType } from '@rocket.chat/core-typings';

import { settings } from '../../../../app/settings/server/cached';

export function getManagementServerConfig(): IVoipManagementServerConfig {
	return {
		type: ServerType.MANAGEMENT,
		host: settings.get<string>('VoIP_Management_Server_Host'),
		name: settings.get<string>('VoIP_Management_Server_Name'),
		configData: {
			port: Number(settings.get<number>('VoIP_Management_Server_Port')),
			username: settings.get<string>('VoIP_Management_Server_Username'),
			password: settings.get<string>('VoIP_Management_Server_Password'),
		},
	};
}

export function getServerConfigDataFromSettings(type: ServerType): IVoipCallServerConfig | IVoipManagementServerConfig {
	switch (type) {
		case ServerType.CALL_SERVER: {
			return {
				type: ServerType.CALL_SERVER,
				name: settings.get<string>('VoIP_Server_Name'),
				configData: {
					websocketPath: settings.get<string>('VoIP_Server_Websocket_Path'),
				},
			};
		}

		case ServerType.MANAGEMENT: {
			return getManagementServerConfig();
		}
	}
}

export function voipEnabled(): boolean {
	return settings.get<boolean>('VoIP_Enabled');
}
