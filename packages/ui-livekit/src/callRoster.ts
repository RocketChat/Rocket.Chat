import type { IVideoConferenceUser, VideoConferenceMemberFederation } from '@rocket.chat/core-typings';
import { isInVideoConference } from '@rocket.chat/core-typings';

import type { CallSFU, RemoteSFU } from './callConnections';
import type { CallPerson } from './callParticipants';

/** A conference member as the call reads them: who they are, whether they are in the call, and where they publish. */
export type CallMember = Pick<IVideoConferenceUser, '_id' | 'username' | 'name' | 'joined' | 'leftAt' | 'federation'>;

const remoteSFUOf = ({ serverName, transport }: VideoConferenceMemberFederation): RemoteSFU => ({
	local: false,
	key: JSON.stringify([serverName, transport]),
	serverName,
	transport,
});

/** Every other homeserver's SFU that has members in the call, once each. */
export const remoteSFUsOf = (members: readonly CallMember[]): RemoteSFU[] => {
	const sfus = new Map<string, RemoteSFU>();
	for (const member of members) {
		if (member.federation && !member.federation.local && isInVideoConference(member)) {
			const sfu = remoteSFUOf(member.federation);
			if (!sfus.has(sfu.key)) {
				sfus.set(sfu.key, sfu);
			}
		}
	}
	return [...sfus.values()];
};

const publishesOn = (federation: VideoConferenceMemberFederation, sfu: CallSFU): boolean =>
	sfu.local ? federation.local : !federation.local && federation.serverName === sfu.serverName && federation.transport === sfu.transport;

/** Matrix clients of different generations derive a different identity from the same membership, so any of them is the member's. */
const publishesAs = ({ livekitIdentity, livekitIdentityAliases }: VideoConferenceMemberFederation, identity: string): boolean =>
	livekitIdentity === identity || Boolean(livekitIdentityAliases?.includes(identity));

/**
 * The member a participant seen on an SFU is: the one the roster says publishes there, under that identity. Nobody
 * else on an SFU is a person in the call — not the other homeservers' members watching it, not an agent.
 */
export const memberOn = <TMember extends CallMember>(members: readonly TMember[], sfu: CallSFU, identity: string): TMember | undefined =>
	members.find(({ federation }) => federation && publishesOn(federation, sfu) && publishesAs(federation, identity));

/** Who is who in a federated call, whose participants go by their membership's LiveKit identity rather than their user id. */
export type CallRoster = {
	/** The person a participant seen on an SFU is; undefined for whoever is not a person in the call. */
	personOn: (sfu: CallSFU, identity: string) => CallPerson | undefined;
	/** The identity a person publishes as, on their own SFU. */
	identityOf: (personId: string) => string | undefined;
};

export const createCallRoster = (members: readonly CallMember[], describe: (member: CallMember) => CallPerson): CallRoster => ({
	personOn: (sfu, identity) => {
		const member = memberOn(members, sfu, identity);
		return member && describe(member);
	},
	identityOf: (personId) => members.find(({ _id }) => _id === personId)?.federation?.livekitIdentity,
});
