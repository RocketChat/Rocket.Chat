export type ReplacePlaceholders<TPath extends string> = string extends TPath
	? TPath
	: TPath extends `${infer Start}:${string}/${infer Rest}`
	? `${Start}${string}/${ReplacePlaceholders<Rest>}`
	: TPath extends `${infer Start}:${string}`
	? `${Start}${string}`
	: TPath;
