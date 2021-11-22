export type ReplacePlaceholders<TPath extends string> = string extends TPath
	? TPath
	: TPath extends `${infer Start}:${infer _Param}/${infer Rest}`
	? `${Start}${string}/${ReplacePlaceholders<Rest>}`
	: TPath extends `${infer Start}:${infer _Param}`
	? `${Start}${string}`
	: TPath;
