// Type guards for the error
export function isStringError(error: unknown): error is { error: string } {
	return typeof (error as any)?.error === 'string';
}
