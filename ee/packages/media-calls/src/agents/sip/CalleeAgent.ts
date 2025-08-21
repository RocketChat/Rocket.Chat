import { SipActorAgent } from './BaseSipAgent';
import type { SipUserData } from '../definition/common';

export class SipActorCalleeAgent extends SipActorAgent {
	constructor(user: SipUserData) {
		super(user, 'callee');
	}
}
