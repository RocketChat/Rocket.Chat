import { calledFunctions, functions } from './data';
import type { BaseFunction, PatchData } from './definition';

export const getFunctionPatches = <T extends BaseFunction>(baseFunction: T): Set<PatchData<T>> => {
	if (calledFunctions.has(baseFunction)) {
		throw new Error('Patching a function that was already used.');
	}

	const patches = functions.get(baseFunction) as Set<PatchData<T>> | undefined;
	if (!patches) {
		throw new Error('Specified function can not be patched');
	}

	return patches;
};
