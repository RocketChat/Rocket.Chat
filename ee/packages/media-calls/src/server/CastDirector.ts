import type { IUser, MediaCallActor, MediaCallActorType, MediaCallContact, MediaCallContactInformation } from '@rocket.chat/core-typings';
import type { CallRole } from '@rocket.chat/media-signaling';
import { Users } from '@rocket.chat/models';

import { BroadcastActorAgent } from './BroadcastAgent';
import { getDefaultSettings } from './getDefaultSettings';
import type { IMediaCallAgent } from '../definition/IMediaCallAgent';
import type { IMediaCallCastDirector, ICastDirectorSettings } from '../definition/IMediaCallCastDirector';
import type { GetActorContactOptions, MinimalUserData, MediaCallHeader } from '../definition/common';
import { UserActorAgent } from '../internal/agents/UserActorAgent';
import { logger } from '../logger';

type ContactList = Record<MediaCallActorType, MediaCallContact | null>;

export class MediaCallCastDirector implements IMediaCallCastDirector {
	private settings: ICastDirectorSettings = { identityLookup: getDefaultSettings().sip.identityLookup };

	public configure(settings: ICastDirectorSettings): void {
		this.settings = settings;
	}

	public async getAgentsFromCall(call: MediaCallHeader): Promise<{ caller: IMediaCallAgent; callee: IMediaCallAgent }> {
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

	public async getAgentFromCall(call: MediaCallHeader, role: CallRole): Promise<IMediaCallAgent | null> {
		const { [role]: actor } = call;

		return this.getAgentForActorAndRole(actor, role);
	}

	public async getContactForActor(
		actor: MediaCallActor,
		options: GetActorContactOptions,
		defaultContactInfo?: MediaCallContactInformation,
	): Promise<MediaCallContact | null> {
		if (actor.type === 'user') {
			return this.getContactForUserId(actor.id, options, { ...actor, ...defaultContactInfo });
		}

		if (actor.type === 'sip') {
			return this.getContactForExtensionNumber(actor.id, options, { ...actor, ...defaultContactInfo });
		}

		return null;
	}

	public getContactForUser(
		user: MinimalUserData,
		options: GetActorContactOptions,
		defaultContactInfo?: MediaCallContactInformation,
	): MediaCallContact | null {
		const actors = this.buildContactListForUser(user, defaultContactInfo);
		return this.getContactFromList(actors, options);
	}

	public async getContactForUserId(
		userId: string,
		options: GetActorContactOptions,
		defaultContactInfo?: MediaCallContactInformation,
	): Promise<MediaCallContact | null> {
		const user = await Users.findOneById<Pick<IUser, '_id' | 'name' | 'username' | 'freeSwitchExtension'>>(userId, {
			projection: { name: 1, username: 1, freeSwitchExtension: 1 },
		});
		if (!user) {
			return null;
		}

		return this.getContactForUser(user, options, defaultContactInfo);
	}

	public async getContactForExtensionNumber(
		sipExtension: string,
		options: GetActorContactOptions,
		defaultContactInfo?: MediaCallContactInformation,
	): Promise<MediaCallContact | null> {
		const user = await Users.findOneByFreeSwitchExtension<Pick<IUser, '_id' | 'name' | 'username' | 'freeSwitchExtension'>>(sipExtension, {
			projection: { name: 1, username: 1, freeSwitchExtension: 1 },
		});

		const list = user
			? this.buildContactListForUser(user, defaultContactInfo)
			: await this.buildContactListForExtension(sipExtension, defaultContactInfo);

		return this.getContactFromList(list, options);
	}

	private async findUserByIndentityLookup(
		sipIdentifier: string,
	): Promise<Pick<IUser, '_id' | 'name' | 'username' | 'freeSwitchExtension'> | null> {
		const { identityLookup } = this.settings;
		if (!identityLookup.enabled || !identityLookup.customFieldName) {
			return null;
		}

		return Users.findOneByCustomFieldValue<Pick<IUser, '_id' | 'name' | 'username' | 'freeSwitchExtension'>>(
			identityLookup.customFieldName,
			sipIdentifier,
			{ projection: { name: 1, username: 1, freeSwitchExtension: 1 } },
		);
	}

	public async getAgentForActorAndRole(actor: MediaCallContact, role: CallRole): Promise<IMediaCallAgent | null> {
		if (actor.type === 'user') {
			return this.getAgentForUserActorAndRole(actor, role);
		}

		if (actor.type === 'sip') {
			return this.getAgentForSipActorAndRole(actor, role);
		}

		logger.warn({ msg: 'Invalid actor type', actor });
		return null;
	}

	protected async getAgentForUserActorAndRole(actor: MediaCallContact, role: CallRole): Promise<UserActorAgent | null> {
		return new UserActorAgent(actor, role);
	}

	protected async getAgentForSipActorAndRole(actor: MediaCallContact, role: CallRole): Promise<BroadcastActorAgent | null> {
		return new BroadcastActorAgent(actor, role);
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

	protected async buildContactListForExtension(
		sipExtension: string,
		defaultContactInfo?: MediaCallContactInformation,
	): Promise<ContactList> {
		const user = await this.findUserByIndentityLookup(sipExtension);

		const data: Partial<MediaCallContact> = {
			...defaultContactInfo,
			...(sipExtension && { sipExtension }),
			...(user?.username && { username: user.username }),
			...(user?.name && { displayName: user.name }),
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
		if (options.requiredType) {
			return list[options.requiredType] ?? null;
		}

		const preferredActor = options.preferredType && list[options.preferredType];
		return preferredActor || list.user || list.sip || null;
	}
}
