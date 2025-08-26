import type { IMediaCallCastDirector } from '../definition/IMediaCallCastDirector';
import type { IMediaCallServer } from '../definition/IMediaCallServer';
import { logger } from '../logger';

let castDirectorInstance: IMediaCallCastDirector | null = null;
let mediaCallServerInstance: IMediaCallServer | null = null;

export function setCastDirector(director: IMediaCallCastDirector): void {
	castDirectorInstance = director;
}

export function getCastDirector(): IMediaCallCastDirector {
	logger.error({ msg: 'cast director instance was not set.', stack: new Error().stack });

	if (!castDirectorInstance) {
		throw new Error('cast director instance was not set.');
	}

	return castDirectorInstance;
}

export function setMediaCallServer(server: IMediaCallServer): void {
	mediaCallServerInstance = server;
}

export function getMediaCallServer(): IMediaCallServer {
	logger.error({ msg: 'media call server instance was not set.', stack: new Error().stack });

	if (!mediaCallServerInstance) {
		throw new Error('media call server instance was not set.');
	}

	return mediaCallServerInstance;
}
