import 'mongodb';

declare module 'mongodb' {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	interface FindOneOptions<T> {
		awaitData?: boolean;
	}
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface Transaction {
		state:
			| 'NO_TRANSACTION'
			| 'STARTING_TRANSACTION'
			| 'TRANSACTION_IN_PROGRESS'
			| 'TRANSACTION_COMMITTED'
			| 'TRANSACTION_COMMITTED_EMPTY'
			| 'TRANSACTION_ABORTED';
	}
}
