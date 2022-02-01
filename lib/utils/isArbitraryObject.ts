export const isArbitraryObject = (potentialObject: unknown): potentialObject is { [key: string]: unknown } => {
	return typeof potentialObject === 'object' && potentialObject !== null;
};
