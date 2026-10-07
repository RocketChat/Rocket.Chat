import type { MatrixRTCProfile } from './config';
import { legacyLiveKitIdentityFor, liveKitIdentityFor, sfuGetLiveKitIdentityFor } from './derive';
import type { AnnouncedMembership } from './events';

type Member = Pick<AnnouncedMembership, 'userId' | 'deviceId' | 'memberId'>;

/** The identity this server mints for one of its users: the one every client reading that profile's membership expects. */
export const localLiveKitIdentityFor = (profile: MatrixRTCProfile, { userId, deviceId, memberId }: Member): string => {
	switch (profile) {
		case 'compatibility':
			return sfuGetLiveKitIdentityFor(userId, deviceId);
		case 'matrix_2_0':
			return legacyLiveKitIdentityFor(userId, deviceId, memberId);
		case 'matrix_2_0_msc4195':
			return liveKitIdentityFor(userId, memberId);
	}
};

/**
 * Every identity a member of another server may publish as, since each client generation derives it differently from
 * the same membership ([protocol §4.1](../../../../../docs/features/video-conference-federation/protocol.md)). The
 * first is what deployed Element Call uses for that membership.
 */
export const remoteLiveKitIdentitiesFor = ({
	form,
	userId,
	deviceId,
	memberId,
	transport,
}: Member & Pick<AnnouncedMembership, 'form' | 'transport'>): { livekitIdentity: string; livekitIdentityAliases: string[] } => {
	const candidates =
		form === 'compatibility'
			? [sfuGetLiveKitIdentityFor(userId, deviceId), ...(transport.url ? [liveKitIdentityFor(userId, memberId)] : [])]
			: [
					...(transport.serviceUrl
						? [legacyLiveKitIdentityFor(userId, deviceId, memberId), sfuGetLiveKitIdentityFor(userId, deviceId)]
						: []),
					...(transport.url ? [liveKitIdentityFor(userId, memberId)] : []),
				];

	const [livekitIdentity, ...livekitIdentityAliases] = [...new Set(candidates)];

	return { livekitIdentity, livekitIdentityAliases };
};
