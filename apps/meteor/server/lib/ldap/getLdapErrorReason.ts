export function getLdapErrorReason(error: unknown): string {
	if (error instanceof AggregateError && error.errors.length > 0) {
		return getLdapErrorReason(error.errors[0]);
	}

	if (error instanceof Error) {
		return error.message || (error as NodeJS.ErrnoException).code || error.name;
	}

	return String(error);
}
