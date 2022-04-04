import 'mongodb';

declare module 'mongodb' {
	// eslint-disable-next-line @typescript-eslint/interface-name-prefix
	export interface FindOneOptions<T> {
		awaitData?: boolean;
	}
}
