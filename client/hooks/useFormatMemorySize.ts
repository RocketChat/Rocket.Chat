import s from 'underscore.string';

const formatMemorySize = (memorySize: number): string | null => {
	if (typeof memorySize !== 'number') {
		return null;
	}

	const units = ['bytes', 'kB', 'MB', 'GB'];

	let order;
	for (order = 0; order < units.length - 1; ++order) {
		const upperLimit = Math.pow(1024, order + 1);

		if (memorySize < upperLimit) {
			break;
		}
	}

	const divider = Math.pow(1024, order);
	const decimalDigits = order === 0 ? 0 : 2;
	return `${s.numberFormat(memorySize / divider, decimalDigits)} ${units[order]}`;
};

export const useFormatMemorySize = (): ((memorySize: number) => string | null) => formatMemorySize;
