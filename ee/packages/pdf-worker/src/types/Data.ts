export type Data = {
	header: Record<string, unknown>;
	messages: unknown[];
	t: (key: string) => unknown;
};
