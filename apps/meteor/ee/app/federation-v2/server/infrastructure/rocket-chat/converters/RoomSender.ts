import type { IRoom, IUser } from '@rocket.chat/core-typings';

import type { FederationBeforeAddUserToARoomDto } from '../../../application/input/RoomSenderDto';
import {
	FederationBeforeDirectMessageRoomCreationDto,
	FederationCreateDirectMessageDto,
	FederationOnDirectMessageRoomCreationDto,
	FederationOnRoomCreationDto,
	FederationOnUsersAddedToARoomDto,
	FederationRoomInviteUserDto,
	FederationSetupRoomDto,
} from '../../../application/input/RoomSenderDto';

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

	public static toSetupRoomDto(internalInviterId: string, internalRoomId: string): FederationSetupRoomDto {
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
		const withoutOwner = externalInviteesUsername.filter(Boolean).filter((inviteeUsername) => inviteeUsername !== internalInviterUsername);
		const users = FederationRoomSenderConverterEE.normalizeInvitees(withoutOwner, homeServerDomainName);

		return Object.assign(new FederationOnRoomCreationDto(), {
			internalInviterId,
			internalRoomId,
			invitees: users,
		});
	}

	public static toOnAddedUsersToARoomDto(
		internalInviterId: string,
		internalInviterUsername: string,
		internalRoomId: string,
		externalInvitees: IUser[] | string[],
		homeServerDomainName: string,
	): FederationOnUsersAddedToARoomDto {
		const externalInviteesUsername: string[] = FederationRoomSenderConverterEE.getInviteesUsername(externalInvitees);
		const externalInviterId =
			internalInviterUsername.includes(':') && internalInviterUsername !== homeServerDomainName ? internalInviterId : undefined;

		const withoutOwner = externalInviteesUsername.filter(Boolean).filter((inviteeUsername) => inviteeUsername !== internalInviterUsername);
		const users = FederationRoomSenderConverterEE.normalizeInvitees(withoutOwner, homeServerDomainName);

		return Object.assign(new FederationOnUsersAddedToARoomDto(), {
			internalInviterId,
			internalRoomId,
			invitees: users,
			...(externalInviterId ? { externalInviterId } : {}),
		});
	}

	public static toOnDirectMessageCreatedDto(
		internalInviterId: string,
		internalRoomId: string,
		externalInvitees: (IUser | string)[],
		homeServerDomainName: string,
	): FederationOnDirectMessageRoomCreationDto {
		const withoutOwner = externalInvitees.filter(Boolean).filter((invitee) => {
			if (typeof invitee === 'string') {
				return invitee;
			}
			return invitee._id !== internalInviterId;
		});
		const externalInviterId = internalInviterId.includes('@') && internalInviterId.includes(':') ? internalInviterId : undefined;
		const externalUsersToBeInvited = FederationRoomSenderConverterEE.getExternalUsersToBeInvited(withoutOwner);
		let allUsernamesToBeInvited = FederationRoomSenderConverterEE.getInviteesUsername(externalUsersToBeInvited);
		if (allUsernamesToBeInvited.length > 0) {
			const internalUsernamesToBeInvitedAsWell = FederationRoomSenderConverterEE.getInternalUsernames(withoutOwner).filter(
				(internal) => !allUsernamesToBeInvited.includes(internal),
			);
			allUsernamesToBeInvited = [...allUsernamesToBeInvited, ...internalUsernamesToBeInvitedAsWell];
		}

		const users = FederationRoomSenderConverterEE.normalizeInvitees(allUsernamesToBeInvited, homeServerDomainName);

		return Object.assign(new FederationOnDirectMessageRoomCreationDto(), {
			internalInviterId,
			internalRoomId,
			invitees: users,
			...(externalInviterId ? { externalInviterId } : {}),
		});
	}

	public static toBeforeDirectMessageCreatedDto(
		members: (IUser | string)[],
		homeServerDomainName: string,
	): FederationBeforeDirectMessageRoomCreationDto {
		const invitees = FederationRoomSenderConverterEE.getExternalUsersToBeInvited(members);
		const inviteesUsername = FederationRoomSenderConverterEE.getInviteesUsername(invitees);
		const users = FederationRoomSenderConverterEE.normalizeInvitees(inviteesUsername, homeServerDomainName);

		return Object.assign(new FederationBeforeDirectMessageRoomCreationDto(), {
			invitees: users,
		});
	}

	public static toBeforeAddUserToARoomDto(
		members: (IUser | string)[],
		internalRoom: IRoom,
		homeServerDomainName: string,
	): FederationBeforeAddUserToARoomDto {
		const dto = FederationRoomSenderConverterEE.toBeforeDirectMessageCreatedDto(members, homeServerDomainName);

		return Object.assign(dto, {
			internalRoomId: internalRoom._id,
		}) as FederationBeforeAddUserToARoomDto;
	}

	public static toCreateDirectMessageDto(internalInviterId: string, invitees: string[]): FederationCreateDirectMessageDto {
		return Object.assign(new FederationCreateDirectMessageDto(), {
			internalInviterId,
			invitees,
		});
	}

	private static ensureUserHasAHomeServer(username: string, localHomeServer: string): string {
		return username?.includes(':') ? username : `${username}:${localHomeServer}`;
	}

	private static normalizeInvitees(externalInviteesUsername: string[], homeServerDomainName: string): Record<string, any> {
		return externalInviteesUsername
			.filter(Boolean)
			.map((inviteeUsername) => FederationRoomSenderConverterEE.ensureUserHasAHomeServer(inviteeUsername, homeServerDomainName))
			.map((inviteeUsername) => ({
				normalizedInviteeId: inviteeUsername.replace('@', ''),
				inviteeUsernameOnly: inviteeUsername.split(':')[0]?.replace('@', ''),
				rawInviteeId: `@${inviteeUsername.replace('@', '')}`,
			}));
	}

	private static getInviteesUsername(externalInvitees: (IUser | string)[]): string[] {
		return externalInvitees.map((invitee) => {
			if (typeof invitee === 'string') {
				return invitee;
			}
			return invitee.username as string;
		});
	}

	private static getExternalUsersToBeInvited(invitees: (IUser | string)[]): (IUser | string)[] {
		const externalAndNonExistentInviteesUsername = invitees.filter((invitee: IUser | string) => typeof invitee === 'string');
		const externalExistentUsers = invitees
			.filter((invitee) => typeof invitee !== 'string')
			.filter((invitee) => (invitee as IUser).federated === true || (invitee as IUser).username?.includes(':'));

		return [...externalAndNonExistentInviteesUsername, ...externalExistentUsers];
	}

	private static getInternalUsernames(invitees: (IUser | string)[]): string[] {
		return invitees
			.filter((invitee) => typeof invitee !== 'string')
			.map((invitee) => (invitee as IUser).username as string)
			.filter(Boolean);
	}
}
