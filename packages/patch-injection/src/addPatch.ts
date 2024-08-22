import type { BaseFunction, PatchData, PatchFunction } from './definition';
import { getFunctionPatches } from './getFunctionPatches';

export const addPatch = <T extends BaseFunction>(baseFunction: T, patch: PatchFunction<T>, condition?: () => boolean) => {
	const patches = getFunctionPatches(baseFunction);

	const patchData: PatchData<T> = {
		patchFunction: patch,
		condition,
	};

	patches.add(patchData);

	return () => {
		patches.delete(patchData);
	};
};
