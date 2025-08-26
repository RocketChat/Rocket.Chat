import type { MediaCallContact } from '@rocket.chat/core-typings';

import { SipActorAgent } from './BaseSipAgent';

export class SipActorCallerAgent extends SipActorAgent {
	constructor(contact: MediaCallContact) {
		super(contact, 'caller');
	}
}
