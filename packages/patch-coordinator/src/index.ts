type BaseFunction = (...args: any[]) => any;
type PatchFunction<T extends BaseFunction> = (next: T, ...args: Parameters<T>) => ReturnType<T>;
type PatchData<T extends BaseFunction> = {
	patchFunction: PatchFunction<T>;
	condition?: () => boolean;
};

export class PatchCoordinator {
	private static functions = new Map<BaseFunction, Set<PatchData<BaseFunction>>>();

	private static calledFunctions = new Set<BaseFunction>();

	static makeFunction<T extends BaseFunction>(fn: T): T {
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

			PatchCoordinator.calledFunctions.add(result);
			return newFn(...args);
		}) as T;

		PatchCoordinator.functions.set(result, patches as Set<PatchData<BaseFunction>>);
		return result;
	}

	static getFunctionPatches<T extends BaseFunction>(baseFunction: T): Set<PatchData<T>> {
		if (PatchCoordinator.calledFunctions.has(baseFunction)) {
			throw new Error('Patching a function that was already used.');
		}

		const patches = PatchCoordinator.functions.get(baseFunction) as Set<PatchData<T>> | undefined;
		if (!patches) {
			throw new Error('Specified function can not be patched');
		}

		return patches;
	}

	static addPatch<T extends BaseFunction>(baseFunction: T, patch: PatchFunction<T>, condition?: () => boolean) {
		const patches = PatchCoordinator.getFunctionPatches(baseFunction);

		const patchData: PatchData<T> = {
			patchFunction: patch,
			condition,
		};

		patches.add(patchData);

		return () => {
			patches.delete(patchData);
		};
	}
}
