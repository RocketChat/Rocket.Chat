import type { IMediaCallAppGateway } from '../definition/IMediaCallAppGateway';
import type { IMediaCallCastDirector } from '../definition/IMediaCallCastDirector';
import type { IMediaCallServer } from '../definition/IMediaCallServer';
import { logger } from '../logger';

let castDirectorInstance: IMediaCallCastDirector | null = null;
let mediaCallServerInstance: IMediaCallServer | null = null;
let appGatewayInstance: IMediaCallAppGateway | null = null;

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

export function setMediaCallAppGateway(gateway: IMediaCallAppGateway): void {
	appGatewayInstance = gateway;
}

/**
 * Returns the injected app gateway used to dispatch `cti` call control to apps, or `null` when no
 * cti-capable app integration is configured (in which case cti calls can't be handled).
 */
export function getMediaCallAppGateway(): IMediaCallAppGateway | null {
	return appGatewayInstance;
}
