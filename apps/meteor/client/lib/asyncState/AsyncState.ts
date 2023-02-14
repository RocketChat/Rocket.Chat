import type { AsyncStatePhase } from './AsyncStatePhase';

export type AsyncState<T> =
	| { phase: AsyncStatePhase.LOADING; value: undefined; error: undefined }
	| { phase: AsyncStatePhase.LOADING; value: T; error: undefined }
	| { phase: AsyncStatePhase.LOADING; value: undefined; error: Error }
	| { phase: AsyncStatePhase.RESOLVED; value: T; error: undefined }
	| { phase: AsyncStatePhase.UPDATING; value: T; error: undefined }
	| { phase: AsyncStatePhase.REJECTED; value: undefined; error: Error };
