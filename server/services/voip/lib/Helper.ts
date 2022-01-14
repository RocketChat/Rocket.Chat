import { ServerType } from '../../../../definition/IVoipServerConfig';
import { settings } from '../../../../app/settings/server';

export function getServerConfigDataFromSettings(type: ServerType): any {
	// return this.VoipServerConfiguration.findOne({ type, active: true });
	switch (type) {
		case ServerType.CALL_SERVER: {
			const serverCofig = {
				type: ServerType.CALL_SERVER,
				host: settings.get('VoIP_Server_Host'),
				name: settings.get('VoIP_Server_Name'),
				configData: {
					websocketPort: parseInt(settings.get('VoIP_Server_Websocket_Port')),
					websocketPath: settings.get('VoIP_Server_Websocket_Path'),
				},
			};
			return serverCofig;
		}

		case ServerType.MANAGEMENT: {
			const serverCofig = {
				type: ServerType.MANAGEMENT,
				host: settings.get('VoIP_Management_Server_Host'),
				name: settings.get('VoIP_Management_Server_Name'),
				configData: {
					port: parseInt(settings.get('VoIP_Management_Server_Port')),
					username: settings.get('VoIP_Management_Server_Username'),
					password: settings.get('VoIP_Management_Server_Password'),
				},
			};
			return serverCofig;
		}
	}
}
