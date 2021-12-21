import { AsyncStatePhase } from './AsyncStatePhase';

export type AsyncState<T> =
	| { phase: AsyncStatePhase.LOADING; value: undefined; error: undefined; reset: () => Promise<void>; }
	| { phase: AsyncStatePhase.LOADING; value: T; error: undefined; reset: () => Promise<void>; }
	| { phase: AsyncStatePhase.LOADING; value: undefined; error: Error; reset: () => Promise<void>; }
	| { phase: AsyncStatePhase.RESOLVED; value: T; error: undefined; reset: () => Promise<void>; }
	| { phase: AsyncStatePhase.UPDATING; value: T; error: undefined; reset: () => Promise<void>; }
	| { phase: AsyncStatePhase.REJECTED; value: undefined; error: Error; reset: () => Promise<void>; }
