import type { MediaCallActor, MediaCallContact } from '@rocket.chat/core-typings';
import type { CallContact, CallRole, CallNotification } from '@rocket.chat/media-signaling';

import { logger } from '../../logger';
import type { IMediaCallBasicAgent, INewMediaCallAgent } from '../definition/IMediaCallAgent';
import { MediaCallBasicAgent } from '../definition/IMediaCallAgent';

type SipInviteData = {
	localDescription?: RTCSessionDescriptionInit;
};

export class SipBasicAgent<T extends IMediaCallBasicAgent = INewMediaCallAgent> extends MediaCallBasicAgent<T> {
	protected localDescription?: RTCSessionDescriptionInit;

	constructor(
		protected readonly contact: MediaCallContact<MediaCallActor<'sip'>>,
		data: { role: CallRole; contractId?: string },
	) {
		super({ type: 'sip', id: contact.id, ...data });
	}

	public isRepresentingActor(actor: MediaCallActor): actor is MediaCallActor<'sip'> {
		return super.isRepresentingActor(actor);
	}

	public async getContactInfo(): Promise<CallContact> {
		return {
			...this.contact,
			type: 'sip',
			username: this.contact.username || this.contact.id,
			sipExtension: this.contact.sipExtension || this.contact.id,
			displayName: this.contact.displayName || this.contact.id,
		};
	}

	public async notify(callId: string, notification: CallNotification, _signedContractId?: string): Promise<void> {
		logger.debug({ msg: 'SipBasicAgent.notify', callId, notification });
		// return this.sendSignal({
		// 	callId,
		// 	type: 'notification',
		// 	notification,
		// 	...(signedContractId && { signedContractId }),
		// });
	}

	public setDataFromInvite(data: SipInviteData): void {
		if (data.localDescription) {
			this.localDescription = data.localDescription;
		}
	}
}
