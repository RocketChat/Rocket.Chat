import type { IMediaCallCastDirector } from '../definition/IMediaCallCastDirector.js';
import type { IMediaCallServer } from '../definition/IMediaCallServer.js';
import { logger } from '../logger.js';

let castDirectorInstance: IMediaCallCastDirector | null = null;
let mediaCallServerInstance: IMediaCallServer | null = null;

export function setCastDirector(director: IMediaCallCastDirector): void {
	castDirectorInstance = director;
}

export function getCastDirector(): IMediaCallCastDirector {
	if (!castDirectorInstance) {
		logger.error({ msg: 'cast director instance was not set.', stack: new Error().stack });
		throw new Error('cast director instance was not set.');
	}

	return castDirectorInstance;
}

export function setMediaCallServer(server: IMediaCallServer): void {
	mediaCallServerInstance = server;
}

export function getMediaCallServer(): IMediaCallServer {
	if (!mediaCallServerInstance) {
		logger.error({ msg: 'media call server instance was not set.', stack: new Error().stack });
		throw new Error('media call server instance was not set.');
	}

	return mediaCallServerInstance;
}
