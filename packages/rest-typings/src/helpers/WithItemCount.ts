export type WithItemCount<T = {}> = T & {
	count: { total: number }[];
};
