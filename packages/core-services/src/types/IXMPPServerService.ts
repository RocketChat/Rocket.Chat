import type { IMessage, IRoom, IUser } from '@rocket.chat/core-typings';

export interface IXMPPServerService {
	/** Relays a message saved in an XMPP-federated room to its remote recipients. */
	sendMessage(message: IMessage, room: IRoom, user: IUser): Promise<void>;
	/** Makes a newly created hosted room reachable over XMPP. */
	registerHostedRoom(room: IRoom): Promise<void>;
	/** Sends a MUC invitation for a hosted room to a remote XMPP user. */
	inviteToHostedRoom(rid: string, inviterId: string, jid: string): Promise<void>;
	/** Publishes a local member of a hosted room as a virtual MUC occupant. */
	addHostedRoomMember(rid: string, userId: string): Promise<void>;
	/** Withdraws a member from a hosted room: local occupants go offline, remote ones are kicked. */
	removeHostedRoomMember(rid: string, userId: string): Promise<void>;
	/** Joins a remote MUC on behalf of a local user; an existing session is reused. */
	joinRemoteMUC(userId: string, rid: string): Promise<void>;
	/** Leaves a remote MUC on behalf of a local user who left the mirrored room. */
	leaveRemoteMUC(userId: string, rid: string): Promise<void>;
	/** Creates or refreshes the local record of each remote XMPP user. */
	ensureXMPPUsersExistLocally(jids: string[]): Promise<void>;
}
