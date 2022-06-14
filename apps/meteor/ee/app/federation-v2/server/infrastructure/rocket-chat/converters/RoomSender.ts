import { FederationOnRoomCreationDto, FederationRoomInviteUserDto, FederationSetupRoomDto } from '../../../application/input/RoomSenderDto';

export class FederationRoomSenderConverterEE {
	public static toRoomInviteUserDto(
		internalInviterId: string,
		internalRoomId: string,
		externalInviteeId: string,
	): FederationRoomInviteUserDto {
		const normalizedInviteeId = externalInviteeId.replace('@', '');
		const inviteeUsernameOnly = externalInviteeId.split(':')[0]?.replace('@', '');

		return Object.assign(new FederationRoomInviteUserDto(), {
			internalInviterId,
			internalRoomId,
			rawInviteeId: externalInviteeId,
			normalizedInviteeId,
			inviteeUsernameOnly,
		});
	}

	public static toSetupRoomDto(
		internalInviterId: string,
		internalRoomId: string,
	): FederationSetupRoomDto {

		return Object.assign(new FederationSetupRoomDto(), {
			internalInviterId,
			internalRoomId,
		});
	}

	public static toOnRoomCreationDto(
		internalInviterId: string,
		internalInviterUsername: string,
		internalRoomId: string,
		externalInviteesUsername: string[],
		homeServerDomainName: string,
	): FederationOnRoomCreationDto {
		const withoutOwnerAndMapped = externalInviteesUsername
		.filter(Boolean)
		.filter((inviteeUsername) => inviteeUsername !== internalInviterUsername)
		.map((inviteeUsername) => FederationRoomSenderConverterEE.ensureUserHasAHomeServer(inviteeUsername, homeServerDomainName))
		.map((inviteeUsername) => ({
			normalizedInviteeId: inviteeUsername.replace('@', ''),
			inviteeUsernameOnly: inviteeUsername.split(':')[0]?.replace('@', ''),
			rawInviteeId: `@${inviteeUsername.replace('@', '')}`,
		}));

		return Object.assign(new FederationOnRoomCreationDto(), {
			internalInviterId,
			internalRoomId,
			invitees: withoutOwnerAndMapped,
		});
	}

	private static ensureUserHasAHomeServer(username: string, localHomeServer: string): string {
		return username?.includes(':') ? username : `${username}:${localHomeServer}`;
	}
}
