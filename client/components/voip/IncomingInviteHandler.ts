import { User } from "./User"
import { Invitation, Session, InvitationAcceptOptions } from "sip.js"
export class IncomingInviteHandlerUnused {
    config: any;
    user: User;
    session: Session | undefined;
    constructor(config: any, user: User) {
        this.config = config;
        this.user = user;
    }
    handleInvite(invitation: Invitation) {
        this.session = invitation;

    }
    async acceptCall(invitationAcceptOptions: InvitationAcceptOptions) {
        if (!(this.session instanceof Invitation)) {
            throw new Error("Session not instance of Invitation.")
        }
        return await this.session.accept(invitationAcceptOptions);
    }
}