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

export class FederationOnDirectMessageRoomCreationDto {
	internalInviterId: string;

	internalRoomId: string;

	invitees: FederationInviteeDto[];
}

export class FederationCreateDirectMessageDto {
	internalInviterId: string;

	invitees: string[];
}

export class FederationBeforeDirectMessageRoomCreationDto {
	invitees: FederationInviteeDto[];
}

export type FederationBeforeAddUserToARoomDto = FederationBeforeDirectMessageRoomCreationDto;

export type FederationOnUsersAddedToARoomDto = FederationOnRoomCreationDto;

export class FederationSetupRoomDto {
	internalInviterId: string;

	internalRoomId: string;
}
