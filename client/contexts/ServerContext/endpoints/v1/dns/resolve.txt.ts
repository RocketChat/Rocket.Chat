export type ResolveTxtEndpoint = {
	GET: (params: { url: string }) => {
		resolved: Record<string, string | number>;
	};
};
