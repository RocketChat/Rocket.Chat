export const unreachable = (value: never): never => {
	throw new Error(`Reached unreachable code with value: ${value}`);
};
