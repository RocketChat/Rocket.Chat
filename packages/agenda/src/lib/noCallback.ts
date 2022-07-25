export const noCallback = (args: Array<any>, length = 0): void => {
	if (args.length > length) {
		throw new Error(`This function does not accept a callback function. ${args.length}/${length}`);
	}
};
