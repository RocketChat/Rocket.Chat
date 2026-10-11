import type { BaseFunction, PatchFunction, PatchedFunction } from './definition';
import { withMiddleware } from './midleware';

export const makeFunction = <T extends BaseFunction>(fn: T): PatchedFunction<T> => {
	const wrapped = withMiddleware(fn);
	const patch = (fn: PatchFunction<T>, condition?: () => boolean) => {
		return wrapped.use((ctx, next) => {
			if (!condition || condition()) {
				return fn(next as unknown as T, ...ctx);
			}
			return next(...ctx);
		});
	};
	const originalSignature = (() => {
		throw new Error('OriginalSignature of patched functions is not meant to be executed directly.');
	}) as unknown as T;
	const patchSignature = (() => {
		throw new Error('PatchSignature of patched functions is not meant to be executed directly.');
	}) as unknown as PatchFunction<T>;

	return Object.assign(wrapped, {
		patch,
		originalSignature,
		patchSignature,
	}) as PatchedFunction<T>;
};
