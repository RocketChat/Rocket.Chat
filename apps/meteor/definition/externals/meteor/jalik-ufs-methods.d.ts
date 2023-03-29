import '@rocket.chat/ui-contexts';

declare module '@rocket.chat/ui-contexts' {
	interface ServerMethods {
		ufsComplete(fileId: string, storeName: string, token: string): void;
		ufsCreate(file: unknown, token: string): { fileId: string; token: unknown; url: unknown };
		ufsDelete(fileId: string, storeName: string, token: string): unknown;
		ufsImportURL(url: string, file: unknown, storeName: string): unknown;
		ufsStop(fileId: string, storeName: string, token: string): unknown;
	}
}
