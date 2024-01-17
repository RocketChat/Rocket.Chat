export type WithItemCount<T = Record<string, unknown>> = T & {
	count: { total: number }[];
};
