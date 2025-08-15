import type { MediaCallActorType } from '@rocket.chat/core-typings';
import type { CallRole } from '@rocket.chat/media-signaling';

export interface IMediaCallProvider {
	providerName: string;
	supportedRoles: CallRole[];
	actorType: MediaCallActorType;
}
