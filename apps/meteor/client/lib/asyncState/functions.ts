import type { AsyncState } from './AsyncState';
import { AsyncStatePhase } from './AsyncStatePhase';

export const loading = <T>(): AsyncState<T> => ({
	phase: AsyncStatePhase.LOADING,
	value: undefined,
	error: undefined,
});

export const updating = <T>(value: T): AsyncState<T> => ({
	phase: AsyncStatePhase.UPDATING,
	value,
	error: undefined,
});

export const resolved = <T>(value: T): AsyncState<T> => ({
	phase: AsyncStatePhase.RESOLVED,
	value,
	error: undefined,
});

export const rejected = <T>(error: Error): AsyncState<T> => ({
	phase: AsyncStatePhase.REJECTED,
	value: undefined,
	error,
});

export const reload = <T>(prevState: AsyncState<T>): AsyncState<T> => {
	switch (prevState.phase) {
		case AsyncStatePhase.LOADING:
			return prevState;

		case AsyncStatePhase.UPDATING:
		case AsyncStatePhase.RESOLVED:
			return {
				phase: AsyncStatePhase.LOADING,
				value: prevState.value,
				error: undefined,
			};

		case AsyncStatePhase.REJECTED:
			return {
				phase: AsyncStatePhase.LOADING,
				value: undefined,
				error: prevState.error,
			};
	}
};

export const update = <T>(prevState: AsyncState<T>): AsyncState<T> => {
	switch (prevState.phase) {
		case AsyncStatePhase.LOADING:
		case AsyncStatePhase.UPDATING:
			return prevState;

		case AsyncStatePhase.RESOLVED:
			return {
				phase: AsyncStatePhase.UPDATING,
				value: prevState.value,
				error: undefined,
			};

		case AsyncStatePhase.REJECTED:
			return {
				phase: AsyncStatePhase.LOADING,
				value: undefined,
				error: prevState.error,
			};
	}
};

export const resolve = <T>(prevState: AsyncState<T>, value: T): AsyncState<T> => {
	switch (prevState.phase) {
		case AsyncStatePhase.LOADING:
		case AsyncStatePhase.UPDATING:
			return {
				phase: AsyncStatePhase.RESOLVED,
				value,
				error: undefined,
			};

		case AsyncStatePhase.RESOLVED:
		case AsyncStatePhase.REJECTED:
			return prevState;
	}
};

export const reject = <T>(prevState: AsyncState<T>, error: Error): AsyncState<T> => {
	switch (prevState.phase) {
		case AsyncStatePhase.LOADING:
		case AsyncStatePhase.UPDATING:
			return {
				phase: AsyncStatePhase.REJECTED,
				value: undefined,
				error,
			};

		case AsyncStatePhase.RESOLVED:
		case AsyncStatePhase.REJECTED:
			return prevState;
	}
};

export const value = <T>(state: AsyncState<T>): T | undefined => state.value;

export const error = <T>(state: AsyncState<T>): Error | undefined => state.error;
