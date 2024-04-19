import { addPatch } from './addPatch';
import { calledFunctions, functions } from './data';
import type { BaseFunction, PatchData, PatchFunction, PatchedFunction } from './definition';

export const makeFunction = <T extends BaseFunction>(fn: T): PatchedFunction<T> => {
	const patches = new Set<PatchData<T>>();

	patches.add({
		patchFunction: (_next, ...args) => fn(...args),
	});

	const result = ((...args: Parameters<T>): ReturnType<T> => {
		let newFn: T = fn;

		for (const patch of patches) {
			if (patch.condition && !patch.condition()) {
				continue;
			}

			const nextFn = newFn;
			newFn = ((...args: Parameters<T>) => patch.patchFunction(nextFn, ...args)) as T;
		}

		calledFunctions.add(result);
		return newFn(...args);
	}) as PatchedFunction<T>;

	functions.set(result, patches as Set<PatchData<BaseFunction>>);

	result.patch = (patch: PatchFunction<T>, condition?: () => boolean) => addPatch(result, patch, condition);

	return result;
};
