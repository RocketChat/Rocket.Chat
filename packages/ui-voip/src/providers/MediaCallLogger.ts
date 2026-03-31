import type { IMediaSignalLogger } from '@rocket.chat/media-signaling';

export class MediaCallLogger implements IMediaSignalLogger {
	private isDebug: boolean;

	constructor() {
		const searchParams = new URLSearchParams(window.location.search);
		this.isDebug = Boolean(searchParams.get('debug') || searchParams.get('debug-voip'));
	}

	log(...what: Parameters<typeof console.log>): void {
		this.isDebug && console.log(...what);
	}

	debug(...what: Parameters<typeof console.debug>): void {
		this.isDebug && console.debug(...what);
	}

	error(...what: Parameters<typeof console.error>): void {
		console.error(...what);
	}

	warn(...what: Parameters<typeof console.warn>): void {
		console.warn(...what);
	}
}
