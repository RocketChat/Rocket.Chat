import type { IMessage, IRoom, IUser } from '@rocket.chat/core-typings';

export type XMPPServerConfiguration = {
	enabled: boolean;
	domain: string;
	port: number;
	tlsCert: string;
	tlsKey: string;
	mucSubdomain: string;
	domainAllowList: string[];
	presenceEnabled: boolean;
};

export interface IXMPPServerService {
	/** Reconciles the running server against the given configuration (start/restart/stop). */
	configure(config: XMPPServerConfiguration): Promise<void>;
	stop(): Promise<void>;
	isRunning(): boolean;
	/** Called from the outgoing message hook for XMPP-federated rooms. */
	sendMessage(message: IMessage, room: IRoom, user: IUser): Promise<void>;
	/** Registers a hosted MUC room with the protocol core after room creation. */
	registerHostedRoom(room: IRoom): Promise<void>;
	/** Sends a MUC invitation for a hosted room to a remote XMPP user. */
	inviteToHostedRoom(rid: string, inviterId: string, jid: string): Promise<void>;
	/** Publishes a local member of a hosted room as a virtual MUC occupant. */
	addHostedRoomMember(rid: string, userId: string): Promise<void>;
	/** Withdraws a member from a hosted room: local occupants go offline, remote ones are kicked. */
	removeHostedRoomMember(rid: string, userId: string): Promise<void>;
	/** Joins a remote MUC on behalf of a local user (invite acceptance, or any later member). */
	joinRemoteMUC(userId: string, rid: string): Promise<void>;
	/** Leaves a remote MUC on behalf of a local user who left the mirrored room. */
	leaveRemoteMUC(userId: string, rid: string): Promise<void>;
	/** Materializes remote XMPP users as local records before a DM room is created. */
	ensureXMPPUsersExistLocally(jids: string[]): Promise<void>;
}
