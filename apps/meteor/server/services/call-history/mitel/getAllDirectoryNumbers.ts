import type { MitelCallItem } from './definition';
import { normalizeMitelNumber } from './normalizeMitelNumber';

export function getAllDirectoryNumbers(items: MitelCallItem[]): string[] {
	const numbers = new Set<string>();

	for (const item of items) {
		const itemNumbers = [
			item.directoryNumber,
			item.directoryNumber2,
			// item.remoteNumber,
			// item.firstDialledNumber
		];

		for (const value of itemNumbers) {
			const number = value && normalizeMitelNumber(value);

			if (!number || numbers.has(number)) {
				continue;
			}

			numbers.add(number);
			numbers.add(`+${number}`);
		}
	}

	return [...numbers];
}
