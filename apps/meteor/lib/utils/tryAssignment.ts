export const tryAssignment = <T>(assigner: () => T, fallback: (e: any) => T): T => {
	try {
		return assigner();
	} catch (e) {
		return fallback(e);
	}
};

export const tryAssignmentAsync = async <T>(assigner: () => Promise<T>, fallback: (e: any) => Promise<T>): Promise<T> => {
	try {
		return assigner();
	} catch (e) {
		return fallback(e);
	}
};
