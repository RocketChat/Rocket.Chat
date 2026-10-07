import type { IRocketChatRecord } from './IRocketChatRecord';
import type { IRoom } from './IRoom';
import type { IUser } from './IUser';
import type { IVideoConference, VideoConferenceMemberFederation } from './IVideoConference';

/**
 * How a MatrixRTC membership is expressed in the room: Matrix 2.0 sticky events, or the state events Element Call
 * still sends by default.
 */
export type MatrixRTCMode = 'matrix_2_0' | 'compatibility';

/** Where a member publishes their media, as their membership announces it. */
export type MatrixRTCLiveKitTransport = {
	type: 'livekit';
	/** The SFU's WebSocket address, announced by Matrix 2.0 memberships. */
	url?: string;
	/** The service that issues tokens for that SFU, announced by compatibility memberships. */
	serviceUrl?: string;
};

/**
 * One device's presence in one MatrixRTC session, announced by this server for one of its users or received from
 * another server. A user is in a federated call while any of their memberships is.
 */
export interface IMatrixRTCMembership extends IRocketChatRecord {
	rid: IRoom['_id'];
	/** The Matrix room the session lives in. */
	mrid: string;
	slotId: string;
	/** The conference mirroring the session here, once there is one. */
	callId?: IVideoConference['_id'];
	mode: MatrixRTCMode;
	/** The member's Matrix user id. */
	userId: string;
	/** The member's user here: a local user, or the federated user standing for a remote one. */
	uid: IUser['_id'];
	/** Announced by this server, on behalf of one of its own users. */
	local: boolean;
	deviceId: string;
	/** Fresh for every join, so a rejoin is a different membership. */
	memberId: string;
	/** The key of the compatibility state event, which the leave has to reuse. */
	stateKey?: string;
	/** The event that last announced or refreshed the membership: what a ring relates to. */
	eventId?: string;
	transport: MatrixRTCLiveKitTransport;
	/** The homeserver that owns the member's SFU: always the member's own. */
	serverName: string;
	/** The LiveKit identity the member publishes as, which is how their media is told apart. */
	livekitIdentity: string;
	/**
	 * Other identities a remote member may publish as. Matrix clients of different generations derive the identity
	 * differently from the same membership, so a participant matching any of them is this member.
	 */
	livekitIdentityAliases?: string[];
	callIntent?: 'audio' | 'video';
	joinedAt: Date;
	/** Past this, the membership no longer counts, whether or not a leave ever arrives. */
	expiresAt: Date;
}

/** The key that tells one SFU of a federated call from another: its address, or its token service's address. */
export const getMatrixRTCTransportKey = (transport: MatrixRTCLiveKitTransport): string => transport.url || transport.serviceUrl || '';

/** Where a member publishes, as a conference's roster tells clients: from the member's latest membership. */
export const getVideoConferenceMemberFederation = ({
	serverName,
	transport,
	livekitIdentity,
	livekitIdentityAliases,
	local,
}: Pick<
	IMatrixRTCMembership,
	'serverName' | 'transport' | 'livekitIdentity' | 'livekitIdentityAliases' | 'local'
>): VideoConferenceMemberFederation => ({
	serverName,
	transport: getMatrixRTCTransportKey(transport),
	livekitIdentity,
	...(livekitIdentityAliases && { livekitIdentityAliases }),
	local,
});
