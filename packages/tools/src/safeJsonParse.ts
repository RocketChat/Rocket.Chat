export function safeJsonParse<T>(json: string): T | undefined {
	try {
		return JSON.parse(json) as T;
	} catch (error) {
		return undefined;
	}
}
