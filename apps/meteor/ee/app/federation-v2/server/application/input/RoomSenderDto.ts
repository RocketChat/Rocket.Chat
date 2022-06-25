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

	externalInviterId?: string;
}

export class FederationCreateDirectMessageDto {
	internalInviterId: string;

	invitees: string[];
}

export class FederationBeforeDirectMessageRoomCreationDto {
	invitees: FederationInviteeDto[];
}

export class FederationBeforeAddUserToARoomDto extends FederationBeforeDirectMessageRoomCreationDto {
	internalRoomId: string;
}

export class FederationOnUsersAddedToARoomDto extends FederationOnRoomCreationDto {
	externalInviterId?: string;
}

export class FederationSetupRoomDto {
	internalInviterId: string;

	internalRoomId: string;
}
