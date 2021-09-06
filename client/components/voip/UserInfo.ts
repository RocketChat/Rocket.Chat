import { Mongo } from 'meteor/mongo';

export interface IUserInfo {
	_id?: string;
	rocket_agent_id: string;
	sip_identity: {
		auth_user_name: string;
		password: string;
		server_info: {
			type: string;
			server_hosname_or_ip: string;
			websocket_port: number;
			websocket_path: string;
			server_name: string;
		};
	};
}

export const UserInfo = new Mongo.Collection<IUserInfo>('user_info');
