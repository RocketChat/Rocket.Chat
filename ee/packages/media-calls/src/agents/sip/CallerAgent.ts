import { SipActorAgent } from './BaseSipAgent';
import type { SipUserData } from '../definition/common';

export class SipActorCallerAgent extends SipActorAgent {
	constructor(user: SipUserData) {
		super(user, 'caller');
	}
}
