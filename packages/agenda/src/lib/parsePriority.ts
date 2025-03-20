export const parsePriority = (priority: string | number | undefined): number => {
	if (!priority) {
		return 0;
	}

	const priorityMap: Record<string, number> = {
		lowest: -20,
		low: -10,
		normal: 0,
		high: 10,
		highest: 20,
	};

	if (typeof priority === 'number') {
		return priority;
	}

	return priorityMap[priority] || 0;
};
