type ResolveFunc = (value: void | PromiseLike<void>) => void;

type RejectFunc = (reason?: any) => void;

type EventCallback = (...args: any[]) => void;

type ValidEvents = 'managerevent' | 'close' | 'connect' | 'error' | 'timeout';

declare module 'asterisk-manager' {
	class Manager {
		constructor(opts: unknown, ip: string, username: string, password: string, auth: boolean);

		removeAllListeners(): void;

		login(cb: (resolve: ResolveFunc, reject: RejectFunc, error?: Error) => void): void;

		on(event: ValidEvents, cb: EventCallback): void;

		connect(port: string, hostnameOrIp: string): void;

		isConnected(): boolean;

		action(action: object, cb: (err: Error, res: unknown) => void): void;

		disconnect(): void;
	}

	export = Manager;
}
