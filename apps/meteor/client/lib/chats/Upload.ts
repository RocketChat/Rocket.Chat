export type Upload = {
	readonly id: string;
	readonly name: string;
	readonly file: File;
	readonly url: string;
	readonly percentage: number;
	readonly error?: Error;
};
