export function isMetadata(key: string): boolean {
	return key.startsWith('Event-') || key.startsWith('FreeSWITCH-') || key.startsWith('Core-');
}
