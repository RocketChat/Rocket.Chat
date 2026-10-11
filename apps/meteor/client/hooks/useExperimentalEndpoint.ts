import type { ExperimentalEndpoints } from '@rocket.chat/rest-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';

type ExperimentalParams<
	TPath extends keyof ExperimentalEndpoints,
	TMethod extends keyof ExperimentalEndpoints[TPath],
> = ExperimentalEndpoints[TPath][TMethod] extends (params: infer P) => any ? P : never;

type ExperimentalResult<
	TPath extends keyof ExperimentalEndpoints,
	TMethod extends keyof ExperimentalEndpoints[TPath],
> = ExperimentalEndpoints[TPath][TMethod] extends (...args: any) => infer R ? R : never;

/**
 * Like `useEndpoint`, but typed against `ExperimentalEndpoints` instead of the stable `Endpoints` union.
 * Delegates to `useEndpoint` at runtime (same memoisation, same SDK call) and re-narrows the return type.
 */
export function useExperimentalEndpoint<
	TPath extends keyof ExperimentalEndpoints,
	TMethod extends keyof ExperimentalEndpoints[TPath] & string,
>(method: TMethod, path: TPath): (params: ExperimentalParams<TPath, TMethod>) => Promise<ExperimentalResult<TPath, TMethod>> {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return (useEndpoint as any)(method, path) as (params: ExperimentalParams<TPath, TMethod>) => Promise<ExperimentalResult<TPath, TMethod>>;
}
