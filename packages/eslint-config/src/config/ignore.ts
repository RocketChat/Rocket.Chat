type IgnoreConfig = {
	ignores: string[];
	name?: string;
};

export function ignore(ignores: string[], name?: string): IgnoreConfig {
	return {
		ignores,
		name,
	};
}
