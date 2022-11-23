import { JobPriority } from '../agenda/define';

/**
 * Internal method to turn priority into a number
 * @param priority string to parse into number
 */
export const parsePriority = (priority: string | number): number => {
	if (typeof priority === 'number') {
		return priority;
	}

	switch (priority) {
		case 'lowest': {
			return JobPriority.lowest;
		}

		case 'low': {
			return JobPriority.low;
		}

		case 'normal': {
			return JobPriority.normal;
		}

		case 'high': {
			return JobPriority.high;
		}

		case 'highest': {
			return JobPriority.highest;
		}

		default: {
			return JobPriority.normal;
		}
	}
};
