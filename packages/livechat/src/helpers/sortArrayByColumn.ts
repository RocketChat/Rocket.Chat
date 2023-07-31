export const sortArrayByColumn = <T extends any[]>(array: T, column: keyof T, inverted: boolean) =>
	array.sort((a, b) => {
		if (a[column] < b[column] && !inverted) {
			return -1;
		}
		return 1;
	});
