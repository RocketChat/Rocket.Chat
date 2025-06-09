export interface IHomeserverConfigurationStatus {
	serverVersion: {
		name: string;
		version: string;
	};
	wellKnown: {
		server: boolean;
		client: boolean;
	};
	health: {
		ok: boolean;
		error?: string;
	};
}

interface IHomeserverBaseService {
	verifyConfiguration(): Promise<void>;

	configurationStatus(): Promise<IHomeserverConfigurationStatus>;
}

export interface IHomeserverService extends IHomeserverBaseService {
	getUserProfile(userId: string): Promise<any>;

	sendFederationTransaction(txnId: string, pdus: any[], edus: any[]): Promise<void>;

	makeJoin(roomId: string, userId: string): Promise<any>;

	sendJoin(roomId: string, eventId: string, event: any): Promise<any>;

	getRoomState(roomId: string, eventId?: string): Promise<any>;

	queryKeys(deviceKeys: any): Promise<any>;

	sendEvent(roomId: string, event: any): Promise<void>;

	joinRoom(roomId: string, serverName: string): Promise<void>;

	leaveRoom(roomId: string): Promise<void>;

	inviteUser(userId: string, roomId: string): Promise<void>;

	discoverServer(serverName: string): Promise<any>;
}

export interface IHomeserverServiceEE extends IHomeserverService {
	getRoomStateIds?(roomId: string, eventId?: string): Promise<any>;
}