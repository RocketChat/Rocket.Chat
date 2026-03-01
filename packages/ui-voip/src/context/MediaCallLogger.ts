import type { IMediaSignalLogger } from '@rocket.chat/media-signaling';

export class MediaCallLogger implements IMediaSignalLogger {
	private isDebug: boolean;

	constructor() {
		const searchParams = new URLSearchParams(window.location.search);
		this.isDebug = Boolean(searchParams.get('debug') || searchParams.get('debug-voip'));
	}

	log(...what: any[]): void {
		// eslint-disable-next-line no-console
		this.isDebug && console.log(...what);
	}

	debug(...what: any[]): void {
		// eslint-disable-next-line no-console
		this.isDebug && console.debug(...what);
	}

	error(...what: any[]): void {
		// eslint-disable-next-line no-console
		console.error(...what);
	}

	warn(...what: any[]): void {
		// eslint-disable-next-line no-console
		console.warn(...what);
	}
}
