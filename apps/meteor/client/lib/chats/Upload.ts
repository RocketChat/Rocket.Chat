export type Upload = {
	readonly id: string;
	readonly name: string;
	readonly percentage: number;
	readonly error?: Error;
};
