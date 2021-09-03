export type ResolveSrvEndpoint = {
	GET: (params: { url: string }) => {
		resolved: Record<string, string | number>;
	};
};
