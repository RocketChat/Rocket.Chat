export interface HomeserverConfig {
	url: string;
	domain: string;
	appServiceToken: string;
	homeserverToken: string;
}

export interface HomeserverUser {
	id: string;
	username: string;
	displayName?: string;
	avatarUrl?: string;
}

export interface HomeserverRoom {
	id: string;
	name: string;
	topic?: string;
	members: string[];
}

export interface HomeserverMessage {
	id: string;
	roomId: string;
	userId: string;
	content: string;
	timestamp: number;
	edited?: boolean;
}

export type HomeserverEventType = 'message.new' | 'message.edit' | 'message.delete' | 'room.create' | 'room.member.join' | 'room.member.leave' | 'user.profile.update';

export interface HomeserverEvent {
	type: HomeserverEventType;
	id: string;
	timestamp: number;
	data: unknown;
}

export interface HomeserverEventCallbacks {
	onMessage?: (message: HomeserverMessage) => Promise<void>;
	onRoomCreate?: (room: HomeserverRoom) => Promise<void>;
	onMemberJoin?: (roomId: string, userId: string) => Promise<void>;
	onMemberLeave?: (roomId: string, userId: string) => Promise<void>;
	onUserUpdate?: (user: HomeserverUser) => Promise<void>;
}

// Additional types for the adapter
export interface RouteHandler {
	(req: any, res: any, next?: any): Promise<void> | void;
}

export interface RouteDefinition {
	method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
	path: string;
	handler: RouteHandler;
	options?: {
		authRequired?: boolean;
		rateLimit?: number;
		validateParams?: any;
		validateBody?: any;
	};
}

export interface HomeserverInternalConfig {
	serverName: string;
	signingKey: string;
	port?: number;
	database?: {
		url: string;
		type: string;
	};
}