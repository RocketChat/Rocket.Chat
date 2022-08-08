import type { IRoom, IUser } from '@rocket.chat/core-typings';
import { isUserFederated } from '@rocket.chat/core-typings';

import {
	extractServerNameFromExternalIdentifier,
	formatExternalUserIdToInternalUsernameFormat,
	isAnExternalIdentifierFormat,
	isAnExternalUserIdFormat,
	removeExternalSpecificCharsFromExternalIdentifier,
} from '../../../../../../../app/federation-v2/server/infrastructure/matrix/converters/RoomReceiver';
import {
	FederationBeforeAddUserToARoomDto,
	FederationBeforeDirectMessageRoomCreationDto,
	FederationCreateDirectMessageDto,
	FederationOnDirectMessageRoomCreationDto,
	FederationOnRoomCreationDto,
	FederationOnUsersAddedToARoomDto,
	FederationRoomInviteUserDto,
	FederationSetupRoomDto,
} from '../../../application/input/RoomSenderDto';
import type { IFederationInviteeDto } from '../../../application/input/RoomSenderDto';

const ensureUserHasAHomeServer = (username: string, localHomeServer: string): string => {
	return username?.includes(':') ? username : `${username}:${localHomeServer}`;
};

const isAnExistentUser = (invitee: IUser | string): boolean => typeof invitee !== 'string';

const normalizeInvitees = (externalInviteesUsername: string[], homeServerDomainName: string): IFederationInviteeDto[] => {
	return externalInviteesUsername
		.filter(Boolean)
		.map((inviteeUsername) => ensureUserHasAHomeServer(inviteeUsername, homeServerDomainName))
		.map((inviteeUsername) => ({
			normalizedInviteeId: removeExternalSpecificCharsFromExternalIdentifier(inviteeUsername),
			inviteeUsernameOnly: formatExternalUserIdToInternalUsernameFormat(inviteeUsername),
			rawInviteeId: `@${removeExternalSpecificCharsFromExternalIdentifier(inviteeUsername)}`,
		}));
};

const getInviteesUsername = (externalInvitees: (IUser | string)[]): string[] => {
	return externalInvitees
		.map((invitee) => {
			return isAnExistentUser(invitee) ? (invitee as IUser)?.username || '' : (invitee as string);
		})
		.filter(Boolean);
};

const getExternalUsersToBeInvited = (invitees: (IUser | string)[]): (IUser | string)[] => {
	const externalAndNonExistentInviteesUsername = invitees.filter((invitee: IUser | string) => !isAnExistentUser(invitee));
	const externalExistentUsers = invitees
		.filter(isAnExistentUser)
		.filter((invitee) => isUserFederated(invitee as IUser) || isAnExternalIdentifierFormat((invitee as IUser).username || ''));

	return [...externalAndNonExistentInviteesUsername, ...externalExistentUsers];
};

const getInternalUsernames = (invitees: (IUser | string)[]): string[] => {
	return invitees
		.filter(isAnExistentUser)
		.map((invitee) => (invitee as IUser).username || '')
		.filter(Boolean);
};

const getAllUsersExceptOwnerByUserId = (invitees: (IUser | string)[], ownerId: string): (IUser | string)[] =>
	invitees.filter(Boolean).filter((invitee) => {
		return isAnExistentUser(invitee) ? (invitee as IUser)._id !== ownerId : invitee;
	});

const getAllUsersExceptOwnerByUsername = (invitees: string[], ownerUsername: string): string[] =>
	invitees.filter(Boolean).filter((inviteeUsername) => inviteeUsername !== ownerUsername);

export class FederationRoomSenderConverterEE {
	public static toRoomInviteUserDto(
		internalInviterId: string,
		internalRoomId: string,
		externalInviteeId: string,
	): FederationRoomInviteUserDto {
		const normalizedInviteeId = removeExternalSpecificCharsFromExternalIdentifier(externalInviteeId);
		const inviteeUsernameOnly = formatExternalUserIdToInternalUsernameFormat(externalInviteeId);

		return new FederationRoomInviteUserDto({
			internalInviterId,
			internalRoomId,
			rawInviteeId: externalInviteeId,
			normalizedInviteeId,
			inviteeUsernameOnly,
		});
	}

	public static toSetupRoomDto(internalInviterId: string, internalRoomId: string): FederationSetupRoomDto {
		return new FederationSetupRoomDto({
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
		const allExceptOwner = getAllUsersExceptOwnerByUsername(externalInviteesUsername, internalInviterUsername);
		const users = normalizeInvitees(allExceptOwner, homeServerDomainName);

		return new FederationOnRoomCreationDto({
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
		const externalInviteesUsername: string[] = getInviteesUsername(externalInvitees);
		const externalInviterId =
			isAnExternalIdentifierFormat(internalInviterUsername) &&
			extractServerNameFromExternalIdentifier(internalInviterUsername) !== homeServerDomainName &&
			internalInviterId;

		const allExceptOwner = getAllUsersExceptOwnerByUsername(externalInviteesUsername, internalInviterUsername);
		const users = normalizeInvitees(allExceptOwner, homeServerDomainName);

		return new FederationOnUsersAddedToARoomDto({
			internalInviterId,
			internalRoomId,
			invitees: users,
			inviteComesFromAnExternalHomeServer: Boolean(externalInviterId),
		});
	}

	public static toOnDirectMessageCreatedDto(
		internalInviterId: string,
		internalRoomId: string,
		externalInvitees: (IUser | string)[],
		homeServerDomainName: string,
	): FederationOnDirectMessageRoomCreationDto {
		const allExceptOwner = getAllUsersExceptOwnerByUserId(externalInvitees, internalInviterId);
		const externalUsernamesToBeInvited: string[] = getInviteesUsername(getExternalUsersToBeInvited(allExceptOwner));
		const internalUsernamesToBeInvited: string[] = getInternalUsernames(allExceptOwner).filter(
			(internal) => !externalUsernamesToBeInvited.includes(internal),
		);
		const allUsernamesToBeInvited: string[] = [...externalUsernamesToBeInvited, ...internalUsernamesToBeInvited];

		const externalInviterId = isAnExternalUserIdFormat(internalInviterId) && internalInviterId;

		return new FederationOnDirectMessageRoomCreationDto({
			internalInviterId,
			internalRoomId,
			invitees: normalizeInvitees(allUsernamesToBeInvited, homeServerDomainName),
			inviteComesFromAnExternalHomeServer: Boolean(externalInviterId),
		});
	}

	public static toBeforeDirectMessageCreatedDto(
		members: (IUser | string)[],
		homeServerDomainName: string,
	): FederationBeforeDirectMessageRoomCreationDto {
		const invitees = getExternalUsersToBeInvited(members);
		const inviteesUsername = getInviteesUsername(invitees);

		return new FederationBeforeDirectMessageRoomCreationDto({
			invitees: normalizeInvitees(inviteesUsername, homeServerDomainName),
		});
	}

	public static toBeforeAddUserToARoomDto(
		members: (IUser | string)[],
		internalRoom: IRoom,
		homeServerDomainName: string,
	): FederationBeforeAddUserToARoomDto {
		const { invitees } = FederationRoomSenderConverterEE.toBeforeDirectMessageCreatedDto(members, homeServerDomainName);

		return new FederationBeforeAddUserToARoomDto({
			internalRoomId: internalRoom._id,
			invitees,
		});
	}

	public static toCreateDirectMessageDto(internalInviterId: string, invitees: string[]): FederationCreateDirectMessageDto {
		return new FederationCreateDirectMessageDto({
			internalInviterId,
			invitees,
		});
	}
}
