import type { IUser } from '@rocket.chat/core-typings';

interface IFederationInviterDto {
	internalInviterId: string;
}

interface IFederationRoomInviteUserDto extends IFederationInviterDto {
	rawInviteeId: string;
	normalizedInviteeId: string;
	inviteeUsernameOnly: string;
	internalRoomId: string;
}

export interface IFederationInviteeDto {
	rawInviteeId: string;
	normalizedInviteeId: string;
	inviteeUsernameOnly: string;
}

interface IFederationOnRoomCreationDto extends IFederationInviterDto {
	internalRoomId: string;
	invitees: IFederationInviteeDto[];
}

interface IFederationOnDirectMessageCreationDto extends IFederationInviterDto {
	internalRoomId: string;
	invitees: IFederationInviteeDto[];
	inviteComesFromAnExternalHomeServer: boolean;
}

interface IFederationCreateDirectMessageDto extends IFederationInviterDto {
	invitees: string[];
}

type IFederationBeforeAddUserToARoomDto = IFederationOnRoomCreationDto & {
	internalInviter?: IUser;
};

interface IFederationOnUserAddedToARoomDto extends IFederationOnRoomCreationDto {
	inviteComesFromAnExternalHomeServer: boolean;
}

class FederationInviterDto {
	constructor({ internalInviterId }: IFederationInviterDto) {
		this.internalInviterId = internalInviterId;
	}

	internalInviterId: string;
}

export class FederationRoomInviteUserDto extends FederationInviterDto {
	constructor({ internalInviterId, internalRoomId, inviteeUsernameOnly, normalizedInviteeId, rawInviteeId }: IFederationRoomInviteUserDto) {
		super({ internalInviterId });
		this.internalRoomId = internalRoomId;
		this.inviteeUsernameOnly = inviteeUsernameOnly;
		this.normalizedInviteeId = normalizedInviteeId;
		this.rawInviteeId = rawInviteeId;
	}

	internalRoomId: string;

	rawInviteeId: string;

	normalizedInviteeId: string;

	inviteeUsernameOnly: string;
}

export class FederationOnRoomCreationDto extends FederationInviterDto {
	constructor({ internalInviterId, internalRoomId, invitees }: IFederationOnRoomCreationDto) {
		super({ internalInviterId });
		this.internalRoomId = internalRoomId;
		this.invitees = invitees;
	}

	internalRoomId: string;

	invitees: IFederationInviteeDto[];
}

export class FederationOnDirectMessageRoomCreationDto extends FederationInviterDto {
	constructor({ internalInviterId, internalRoomId, invitees, inviteComesFromAnExternalHomeServer }: IFederationOnDirectMessageCreationDto) {
		super({ internalInviterId });
		this.internalRoomId = internalRoomId;
		this.invitees = invitees;
		this.inviteComesFromAnExternalHomeServer = inviteComesFromAnExternalHomeServer;
	}

	internalRoomId: string;

	invitees: IFederationInviteeDto[];

	inviteComesFromAnExternalHomeServer: boolean;
}

export class FederationCreateDirectMessageDto extends FederationInviterDto {
	constructor({ internalInviterId, invitees }: IFederationCreateDirectMessageDto) {
		super({ internalInviterId });
		this.invitees = invitees;
	}

	invitees: string[];
}

export class FederationBeforeDirectMessageRoomCreationDto {
	constructor({ invitees }: Record<string, IFederationInviteeDto[]>) {
		this.invitees = invitees;
	}

	invitees: IFederationInviteeDto[];
}

export class FederationBeforeAddUserToARoomDto extends FederationBeforeDirectMessageRoomCreationDto {
	constructor({ invitees, internalRoomId, internalInviter }: Omit<IFederationBeforeAddUserToARoomDto, 'internalInviterId'>) {
		super({ invitees });
		this.internalRoomId = internalRoomId;
		this.internalInviter = internalInviter;
	}

	internalRoomId: string;

	internalInviter?: IUser;
}

export class FederationOnUsersAddedToARoomDto extends FederationOnRoomCreationDto {
	constructor({ internalInviterId, internalRoomId, invitees, inviteComesFromAnExternalHomeServer }: IFederationOnUserAddedToARoomDto) {
		super({ internalInviterId, internalRoomId, invitees });
		this.inviteComesFromAnExternalHomeServer = inviteComesFromAnExternalHomeServer;
	}

	inviteComesFromAnExternalHomeServer: boolean;
}

export class FederationSetupRoomDto extends FederationInviterDto {
	constructor({ internalInviterId, internalRoomId }: IFederationInviterDto & { internalRoomId: string }) {
		super({ internalInviterId });
		this.internalRoomId = internalRoomId;
	}

	internalRoomId: string;
}
