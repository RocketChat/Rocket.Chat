import type { IMediaSignalLogger } from '@rocket.chat/media-signaling';

export class MediaCallLogger implements IMediaSignalLogger {
	private isDebug: boolean;

	constructor() {
		const searchParams = new URLSearchParams(window.location.search);
		this.isDebug = Boolean(searchParams.get('debug') || searchParams.get('debug-voip'));
	}

	// Replace any[] with unknown[] for better type safety - allows any value but forces type checking
	log(...what: unknown[]): void {
		this.isDebug && console.log(...what);
	}

	debug(...what: unknown[]): void {
		this.isDebug && console.debug(...what);
	}

	error(...what: unknown[]): void {
		console.error(...what);
	}

	warn(...what: unknown[]): void {
		console.warn(...what);
	}
}
