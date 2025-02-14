export interface ISlackbridge {
	isReactionsEnabled: boolean;

	reactionsMap: Map<unknown, unknown>;

	connect(): void;
	reconnect(): Promise<void>;
	disconnect(): Promise<void>;
}
