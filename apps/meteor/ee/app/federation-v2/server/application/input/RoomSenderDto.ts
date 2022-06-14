export class FederationRoomInviteUserDto {
	internalInviterId: string;

	internalRoomId: string;

	rawInviteeId: string;

	normalizedInviteeId: string;

	inviteeUsernameOnly: string;
}

class FederationInviteeDto {
	rawInviteeId: string;

	inviteeUsernameOnly: string;

	normalizedInviteeId: string;
}

export class FederationOnRoomCreationDto {
	internalInviterId: string;

	internalRoomId: string;

	invitees: FederationInviteeDto[];
}

export class FederationSetupRoomDto {
	internalInviterId: string;

	internalRoomId: string;
}
