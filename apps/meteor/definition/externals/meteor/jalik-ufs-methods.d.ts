import '@rocket.chat/ui-contexts';

declare module '@rocket.chat/ui-contexts' {
	interface ServerMethods {
		ufsComplete(fileId: string, storeName: string, token: string): void;
	}
}
