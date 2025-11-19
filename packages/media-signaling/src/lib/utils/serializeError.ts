export function serializeError(error: unknown): string | undefined {
	try {
		if (!error) {
			return undefined;
		}

		if (typeof error === 'string') {
			return error;
		}

		if (typeof error === 'object') {
			if (error instanceof Error) {
				return JSON.stringify({
					...error,
					name: error.name,
					message: error.message,
				});
			}

			const errorData: Record<string, any> = { ...error };
			if ('name' in error) {
				errorData.name = error.name;
			}
			if ('message' in error) {
				errorData.message = error.message;
			}

			if (Object.keys(errorData).length > 0) {
				return JSON.stringify(errorData);
			}
		}
	} catch {
		//
	}

	return undefined;
}
