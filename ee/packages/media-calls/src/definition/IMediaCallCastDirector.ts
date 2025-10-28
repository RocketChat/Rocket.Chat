import type { MediaCallActor, MediaCallContact, MediaCallContactInformation } from '@rocket.chat/core-typings';
import type { CallRole } from '@rocket.chat/media-signaling';

import type { IMediaCallAgent } from './IMediaCallAgent';
import type { GetActorContactOptions, MediaCallHeader, MinimalUserData } from './common';

export interface IMediaCallCastDirector {
	getAgentsFromCall(call: MediaCallHeader): Promise<{ caller: IMediaCallAgent; callee: IMediaCallAgent }>;
	getAgentFromCall(call: MediaCallHeader, role: CallRole): Promise<IMediaCallAgent | null>;
	getContactForActor(
		actor: MediaCallActor,
		options: GetActorContactOptions,
		defaultContactInfo?: MediaCallContactInformation,
	): Promise<MediaCallContact | null>;
	getContactForUser(
		user: MinimalUserData,
		options: GetActorContactOptions,
		defaultContactInfo?: MediaCallContactInformation,
	): MediaCallContact | null;
	getContactForUserId(
		userId: string,
		options: GetActorContactOptions,
		defaultContactInfo?: MediaCallContactInformation,
	): Promise<MediaCallContact | null>;
	getContactForExtensionNumber(
		sipExtension: string,
		options: GetActorContactOptions,
		defaultContactInfo?: MediaCallContactInformation,
	): Promise<MediaCallContact | null>;

	getAgentForActorAndRole(actor: MediaCallContact, role: CallRole): Promise<IMediaCallAgent | null>;
}
