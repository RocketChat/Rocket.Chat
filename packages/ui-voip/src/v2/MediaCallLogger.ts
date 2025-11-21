import { IMediaSignalLogger } from '@rocket.chat/media-signaling';

export class MediaCallLogger implements IMediaSignalLogger {
	private isDebug: boolean;

	constructor() {
		this.isDebug = true;
	}

	log(...what: any[]): void {
		this.isDebug && console.log(...what);
	}

	debug(...what: any[]): void {
		this.isDebug && console.debug(...what);
	}

	error(...what: any[]): void {
		console.error(...what);
	}

	warn(...what: any[]): void {
		console.warn(...what);
	}
}
