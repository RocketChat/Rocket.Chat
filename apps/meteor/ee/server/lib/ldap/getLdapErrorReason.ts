export function getLdapErrorReason(error: unknown): string {
	if (error instanceof AggregateError && error.errors.length > 0) {
		return error.errors.map(getLdapErrorReason).join('; ');
	}

	if (error instanceof Error) {
		return error.message || (error as NodeJS.ErrnoException).code || error.name;
	}

	return String(error);
}
