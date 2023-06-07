import { compile, match } from 'path-to-regexp';

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

export type Params<Key extends string = string> = Readonly<Record<Key, string | undefined>>;

// eslint-disable-next-line @typescript-eslint/naming-convention
interface PathMatch<ParamKey extends string = string> {
	params: Params<ParamKey>;
	pathname: string;
	pattern: PathPattern;
}

// eslint-disable-next-line @typescript-eslint/naming-convention
interface PathPattern {
	path: string;
	caseSensitive?: boolean;
	end?: boolean;
}

export function matchPath<ParamKey extends string = string>(pattern: PathPattern | string, pathname: string): PathMatch<ParamKey> | null {
	if (typeof pattern === 'string') {
		pattern = { path: pattern, caseSensitive: false, end: true };
	}

	const result = match(pattern.path, { encode: encodeURIComponent, sensitive: pattern.caseSensitive, end: pattern.end })(pathname);

	if (!result) {
		return null;
	}

	return {
		params: result.params as Params<ParamKey>,
		pathname: result.path,
		pattern,
	};
}
