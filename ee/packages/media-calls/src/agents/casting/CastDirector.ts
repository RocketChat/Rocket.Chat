import type {
	IMediaCall,
	IUser,
	MediaCallActor,
	MediaCallActorType,
	MediaCallContact,
	MediaCallContactInformation,
} from '@rocket.chat/core-typings';
import type { CallRole } from '@rocket.chat/media-signaling';
import { Users } from '@rocket.chat/models';

import { BroadcastActorAgent } from './BroadcastAgent';
import { logger } from '../../logger';
import type { IMediaCallAgent } from '../definition/IMediaCallAgent';
import { setCastDirector, type IMediaCallCastDirector } from '../definition/IMediaCallCastDirector';
import type { GetActorContactOptions, MinimalUserData } from '../definition/common';
import type { SipActorAgent } from '../sip/BaseSipAgent';
import { SipActorCalleeAgent } from '../sip/CalleeAgent';
import { SipActorCallerAgent } from '../sip/CallerAgent';
import type { UserActorAgent } from '../users/BaseAgent';
import { UserActorCalleeAgent } from '../users/CalleeAgent';
import { UserActorCallerAgent } from '../users/CallerAgent';

type ContactList = Record<MediaCallActorType, MediaCallContact | null>;

export class MediaCallCastDirector implements IMediaCallCastDirector {
	public async getAgentsFromCall(call: IMediaCall): Promise<{ caller: IMediaCallAgent; callee: IMediaCallAgent }> {
		logger.debug({ msg: 'MediaCallCastDirector.getAgentsFromCall', callId: call?._id });

		const callerAgent = await this.getAgentFromCall(call, 'caller');
		if (!callerAgent) {
			throw new Error('Unable to find caller agent');
		}

		const calleeAgent = await this.getAgentFromCall(call, 'callee');
		if (!calleeAgent) {
			throw new Error('Unable to find callee agent');
		}

		callerAgent.oppositeAgent = calleeAgent;
		calleeAgent.oppositeAgent = callerAgent;

		return {
			caller: callerAgent,
			callee: calleeAgent,
		};
	}

	public async getAgentFromCall(call: IMediaCall, role: CallRole): Promise<IMediaCallAgent | null> {
		logger.debug({ msg: 'MediaCallCastDirector.getAgentFromCall', callId: call?._id, role });

		const { [role]: actor } = call;

		// For existing calls, sip agents are replaced with a special agent that broadcast call updates to all server instances instead of processing it directly
		if (actor.type === 'sip') {
			return new BroadcastActorAgent(actor, role);
		}

		return this.getAgentForActorAndRole(actor, role);
	}

	public async getContactForActor(
		actor: MediaCallActor,
		options: GetActorContactOptions,
		defaultContactInfo?: MediaCallContactInformation,
	): Promise<MediaCallContact | null> {
		logger.debug({ msg: 'MediaCallCastDirector.getContactForActor', actor, options, defaultContactInfo });

		if (actor.type === 'user') {
			return this.getContactForUserId(actor.id, options, defaultContactInfo);
		}

		if (actor.type === 'sip') {
			return this.getContactForExtensionNumber(actor.id, options, defaultContactInfo);
		}

		return null;
	}

	public getContactForUser(
		user: MinimalUserData,
		options: GetActorContactOptions,
		defaultContactInfo?: MediaCallContactInformation,
	): MediaCallContact | null {
		logger.debug({ msg: 'MediaCallCastDirector.getContactForUser', user, options, defaultContactInfo });

		const actors = this.buildContactListForUser(user, defaultContactInfo);
		return this.getContactFromList(actors, options);
	}

	public async getContactForUserId(
		userId: string,
		options: GetActorContactOptions,
		defaultContactInfo?: MediaCallContactInformation,
	): Promise<MediaCallContact | null> {
		logger.debug({ msg: 'MediaCallCastDirector.getContactForUserId', userId, options, defaultContactInfo });

		const user = await Users.findOneById<Pick<IUser, '_id' | 'name' | 'username' | 'freeSwitchExtension'>>(userId, {
			projection: { name: 1, username: 1, freeSwitchExtension: 1 },
		});
		if (!user) {
			throw new Error('invalid-callee');
		}

		return this.getContactForUser(user, options, defaultContactInfo);
	}

	public async getContactForExtensionNumber(
		sipExtension: string,
		options: GetActorContactOptions,
		defaultContactInfo?: MediaCallContactInformation,
	): Promise<MediaCallContact | null> {
		logger.debug({ msg: 'MediaCallCastDirector.getContactForExtensionNumber', sipExtension, options, defaultContactInfo });

		const user = await Users.findOneByFreeSwitchExtension<Pick<IUser, '_id' | 'name' | 'username' | 'freeSwitchExtension'>>(sipExtension, {
			projection: { name: 1, username: 1, freeSwitchExtension: 1 },
		});

		const list = user
			? this.buildContactListForUser(user, defaultContactInfo)
			: this.buildContactListForExtension(sipExtension, defaultContactInfo);

		return this.getContactFromList(list, options);
	}

	public async getAgentForActorAndRole(actor: MediaCallContact, role: CallRole): Promise<IMediaCallAgent | null> {
		logger.debug({ msg: 'MediaCallCastDirector.getAgentForActorAndRole', actor, role });

		if (actor.type === 'user') {
			return this.getAgentForUserActorAndRole(actor, role);
		}

		if (actor.type === 'sip') {
			return this.getAgentForSipActorAndRole(actor, role);
		}

		return null;
	}

	protected async getAgentForUserActorAndRole(actor: MediaCallContact, role: CallRole): Promise<UserActorAgent | null> {
		if (role === 'caller') {
			return new UserActorCallerAgent(actor);
		}

		if (role === 'callee') {
			return new UserActorCalleeAgent(actor);
		}

		return null;
	}

	protected async getAgentForSipActorAndRole(actor: MediaCallContact, role: CallRole): Promise<SipActorAgent | null> {
		if (role === 'caller') {
			return new SipActorCallerAgent(actor);
		}

		if (role === 'callee') {
			return new SipActorCalleeAgent(actor);
		}

		return null;
	}

	protected buildContactListForUser(user: MinimalUserData, defaultContactInfo?: MediaCallContactInformation): ContactList {
		const { name: displayName, username, freeSwitchExtension: sipExtension, _id: id } = user;

		const data: Partial<MediaCallContact> = {
			...defaultContactInfo,
			...(displayName && { displayName }),
			...(username && { username }),
			...(sipExtension && { sipExtension }),
		};

		return {
			user: {
				...data,
				type: 'user',
				id,
			},
			sip: sipExtension
				? {
						...data,
						type: 'sip',
						id: sipExtension,
					}
				: null,
		};
	}

	protected buildContactListForExtension(sipExtension: string, defaultContactInfo?: MediaCallContactInformation): ContactList {
		const data: Partial<MediaCallContact> = {
			...defaultContactInfo,
			...(sipExtension && { sipExtension }),
		};

		return {
			user: null,
			sip: {
				...data,
				type: 'sip',
				id: sipExtension,
			},
		};
	}

	protected getContactFromList(list: ContactList, options: GetActorContactOptions): MediaCallContact | null {
		logger.debug({ msg: 'MediaCallCastDirector.getContactFromList', list, options });

		if (options.requiredType) {
			return list[options.requiredType] ?? null;
		}

		const preferredActor = options.preferredType && list[options.preferredType];
		return preferredActor || list.user || list.sip || null;
	}
}

setCastDirector(new MediaCallCastDirector());
