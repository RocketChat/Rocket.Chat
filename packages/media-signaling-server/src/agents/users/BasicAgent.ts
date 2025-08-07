import type { IUser, MediaCallActor } from '@rocket.chat/core-typings';
import type { CallContact, CallRole, ServerMediaSignal, CallNotification } from '@rocket.chat/media-signaling';

import { logger } from '../../logger';
import { sendSignal } from '../../signalHandler';
import type { IMediaCallBasicAgent, INewMediaCallAgent } from '../definition/IMediaCallAgent';
import { MediaCallBasicAgent } from '../definition/IMediaCallAgent';

export type MinimalUserData = Pick<IUser, '_id' | 'name' | 'freeSwitchExtension'> & Pick<Required<IUser>, 'username'>;

export class UserBasicAgent<T extends IMediaCallBasicAgent = INewMediaCallAgent> extends MediaCallBasicAgent<T> {
	constructor(
		protected readonly user: MinimalUserData,
		data: { role: CallRole; contractId?: string },
	) {
		super({ type: 'user', id: user._id, ...data });
	}

	public isRepresentingActor(actor: MediaCallActor): actor is MediaCallActor<'user'> {
		return super.isRepresentingActor(actor);
	}

	public async getContactInfo(): Promise<CallContact> {
		const { _id: id, username, name: displayName, freeSwitchExtension: sipExtension } = this.user;

		return {
			type: 'user',
			id,
			username,
			displayName,
			sipExtension,
			// avatarUrl,
			// host
		};
	}

	public async notify(callId: string, notification: CallNotification): Promise<void> {
		logger.debug({ msg: 'UserBasicAgent.notify', callId, notification });
		return this.sendSignal({
			callId,
			type: 'notification',
			notification,
		});
	}

	protected async sendSignal(signal: ServerMediaSignal): Promise<void> {
		sendSignal(this.user._id, signal);
	}
}
