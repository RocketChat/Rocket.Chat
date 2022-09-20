import 'mongodb';

declare module 'mongodb' {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	export interface FindOneOptions<T> {
		awaitData?: boolean;
	}
}
