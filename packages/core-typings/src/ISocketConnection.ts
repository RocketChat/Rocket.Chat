import type { IncomingHttpHeaders } from 'http';

export interface ISocketConnection {
	id: string;
	instanceId: string;
	loginToken?: string;
	livechatToken?: string;
	onClose(fn: (...args: any[]) => void): void;
	clientAddress: string | undefined;
	httpHeaders: IncomingHttpHeaders;
}

export interface ISocketConnectionLogged extends ISocketConnection {
	loginToken?: string;
}
