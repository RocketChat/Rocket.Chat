export function findSlice(messageUrl: string|undefined, string: string): string {
	if (messageUrl !== undefined) {
		const url = new URL(messageUrl);
		const params = new URLSearchParams(url.search);

		const start = params.get('start');
		const end = params.get('end');

		return string.slice(
			start !== null ? +start : undefined,
			end !== null ? +end : undefined,
		);
	}
	return '';
}
