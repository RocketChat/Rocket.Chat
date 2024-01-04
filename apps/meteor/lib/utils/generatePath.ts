import { compile } from 'path-to-regexp';

type PathParams<TPath extends string> = TPath extends `${string}:${infer TParam}/${infer TRest}`
	? (TParam extends `${infer U}?` ? U : TParam) | PathParams<TRest>
	: TPath extends `${string}:${infer TParam}`
	? TParam extends `${infer U}?`
		? U
		: TParam
	: never;

export function generatePath<TPath extends string>(path: TPath, params?: Partial<Record<PathParams<TPath>, string>>): string {
	return compile(path, { encode: encodeURIComponent })(params);
}
