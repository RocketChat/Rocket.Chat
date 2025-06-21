import type { IncomingHttpHeaders } from 'http';

export interface ISocketConnection {
	id: string;
	instanceId: string;
	loginToken?: string;
	livechatToken?: string;
	clientAddress: string | undefined;
	httpHeaders: IncomingHttpHeaders;
}

export interface ISocketConnectionLogged extends ISocketConnection {
	loginToken?: string;
}
