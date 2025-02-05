import { Tracker } from 'meteor/tracker';

import { queueMicrotask } from './utils/queueMicrotask';

interface ISubscriptionFactory<T> {
	(...args: any[]): [subscribe: (onStoreChange: () => void) => () => void, getSnapshot: () => T];
}

// let fns = [];
// const fns = new Set();

// const refresh = () => {
// 	// console.log(refresh);
// 	fns.forEach((fn) => fn());
// 	// fns = null;
// 	// fns = [];
// };

// const interval = setInterval(() => {
// 	refresh();
// }, 200);
// const clear = () => {
// 	// clearTimeout(timeout);
// 	clearInterval(interval);
// 	fns.clear();
// 	window.clearReactiveFns = null;
// };
// window.clearReactiveFns = clear;
// // // window.refreshReactiveFns = refresh;
// // console.log('refresh', refresh);
// // console.log('clear', clear);
// export const createReactiveSubscriptionFactory =
// 	<T>(computeCurrentValueWith: (...args: any[]) => T): ISubscriptionFactory<T> =>
// 	(...args: any[]): [subscribe: (onStoreChange: () => void) => () => void, getSnapshot: () => T] => {
// 		const callbacks = new Set<() => void>();

// 		let currentValue = computeCurrentValueWith(...args);

// 		// const reactiveFn = (): void => {
// 		// 	currentValue = computeCurrentValueWith(...args);
// 		// 	queueMicrotask(() => {
// 		// 		callbacks.forEach((callback) => {
// 		// 			callback();
// 		// 		});
// 		// 	});
// 		// };
// 		const reactiveFn = (): void => {
// 			currentValue = computeCurrentValueWith(...args);
// 			callbacks.forEach((callback) => {
// 				callback();
// 			});
// 		};
// 		// let computation: Tracker.Computation | undefined;

// 		return [
// 			(callback): (() => void) => {
// 				callbacks.add(callback);
// 				currentValue = computeCurrentValueWith(...args);

// 				if (!fns.has(reactiveFn)) {
// 					fns.add(reactiveFn);
// 				}
// 				// queueMicrotask(() => {
// 				// 	if (!computation || computation.stopped) {
// 				// 		computation = Tracker.autorun(reactiveFn);
// 				// 	}
// 				// });

// 				return (): void => {
// 					callbacks.delete(callback);

// 					if (callbacks.size === 0) {
// 						fns.delete(reactiveFn);
// 						// queueMicrotask(() => computation?.stop());
// 					}
// 				};
// 			},
// 			(): T => currentValue,
// 		];
// 	};

export const createReactiveSubscriptionFactory =
	<T>(computeCurrentValueWith: (...args: any[]) => T): ISubscriptionFactory<T> =>
	(...args: any[]): [subscribe: (onStoreChange: () => void) => () => void, getSnapshot: () => T] => {
		const callbacks = new Set<() => void>();

		let currentValue = computeCurrentValueWith(...args);

		const reactiveFn = (): void => {
			currentValue = computeCurrentValueWith(...args);
			queueMicrotask(() => {
				callbacks.forEach((callback) => {
					callback();
				});
			});
		};

		let computation: Tracker.Computation | undefined;

		return [
			(callback): (() => void) => {
				callbacks.add(callback);

				queueMicrotask(() => {
					if (!computation || computation.stopped) {
						computation = Tracker.autorun(reactiveFn);
					}
				});

				return (): void => {
					callbacks.delete(callback);

					if (callbacks.size === 0) {
						queueMicrotask(() => computation?.stop());
					}
				};
			},
			(): T => currentValue,
		];
	};
