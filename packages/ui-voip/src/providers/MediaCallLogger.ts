import type { IMediaSignalLogger } from '@rocket.chat/media-signaling';

export class MediaCallLogger implements IMediaSignalLogger {
	private isDebug: boolean;

	constructor() {
		const searchParams = new URLSearchParams(window.location.search);
		this.isDebug = Boolean(searchParams.get('debug') || searchParams.get('debug-voip'));
	}

	log(...what: any[]): void {}

	debug(...what: any[]): void {}

	error(...what: any[]): void {
		console.error(...what);
	}

	warn(...what: any[]): void {
		console.warn(...what);
	}
}
