export function isSafeAvatarUrl(urlString: string): boolean {
	try {
		const url = new URL(urlString);
		const protocol = url.protocol.toLowerCase();

		if (protocol === 'http:' || protocol === 'https:') {
			return true;
		}
		if (protocol === 'data:') {
			return urlString.toLowerCase().startsWith('data:image/');
		}

		return false;
	} catch {
		return false;
	}
}
