export type BaseFunction = (...args: any[]) => any;
export type PatchFunction<T extends BaseFunction> = (next: T, ...args: Parameters<T>) => ReturnType<T>;
export type PatchData<T extends BaseFunction> = {
	patchFunction: PatchFunction<T>;
	condition?: () => boolean;
};
export type PatchedFunction<T extends BaseFunction> = T & {
	patch: (patch: PatchFunction<T>, condition?: () => boolean) => () => void;
	originalSignature: T;
	patchSignature: PatchFunction<T>;
};
export type OriginalSignature<P extends PatchedFunction<BaseFunction>> = P['originalSignature'];
export type PatchFor<P extends PatchedFunction<BaseFunction>> = PatchFunction<OriginalSignature<P>>;
