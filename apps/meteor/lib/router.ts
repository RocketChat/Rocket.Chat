/*
  This module mirrors the functionality of the react-router-dom package.
*/

import { compile } from 'path-to-regexp';

type PathParams<TPath extends string> = TPath extends `${string}:${infer TParam}/${infer TRest}`
	? TParam | PathParams<TRest>
	: TPath extends `${string}:${infer TParam}`
	? TParam
	: never;

export function generatePath<TPath extends string>(path: TPath, params?: Record<PathParams<TPath>, string>): string {
	return compile(path, { encode: encodeURIComponent })(params);
}
