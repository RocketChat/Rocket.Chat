export interface IMethodConnection {
	id: string;
	close(fn: (...args: any[]) => void): void;
	onClose(fn: (...args: any[]) => void): void;
	clientAddress: string;
	httpHeaders: Record<string, any>;
	/**
	 * Hashed login token carried by REST connections. Unlike DDP connections, REST requests do not
	 * register the login token in `Accounts._accountData`, so it is exposed here for the two-factor
	 * authorization check to resolve the token without mutating global account data.
	 */
	token?: string;
}
