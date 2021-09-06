import { Invitation, Session, InvitationAcceptOptions } from 'sip.js';

import { User } from './User';

export class IncomingInviteHandlerUnused {
	config: any;

	user: User;

	session: Session | undefined;

	constructor(config: any, user: User) {
		this.config = config;
		this.user = user;
	}

	handleInvite(invitation: Invitation): void {
		this.session = invitation;
	}

	async acceptCall(invitationAcceptOptions: InvitationAcceptOptions): Promise<void> {
		if (!(this.session instanceof Invitation)) {
			throw new Error('Session not instance of Invitation.');
		}
		return this.session.accept(invitationAcceptOptions);
	}
}
