export interface ISlackbridge {
	isReactionsEnabled: boolean;

	reactionsMap: Map<unknown, unknown>;
	aliasFormat: string;
	excludeBotNames: string;

	connect(): void;
	reconnect(): Promise<void>;
	disconnect(): Promise<void>;
}
