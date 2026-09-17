export const getErrorType = (error: unknown): string => (error instanceof Error ? error.name : typeof error);
