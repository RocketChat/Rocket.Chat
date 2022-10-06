import { UserStatus } from '@rocket.chat/core-typings';
import { FederationBaseRoomInputDto, IFederationReceiverBaseRoomInputDto } from './RoomReceiverDto';

interface IFederationUserPresenceInputDto {
	externalSenderId: string;
	currentlyActive: boolean;
	lastActiveAgo: number;
	presence: UserStatus;
	statusMessage?: string;
	avatarUrl?: string;
}

export class FederationUserPresenceEventDto {
	constructor({
		currentlyActive,
        lastActiveAgo,
        presence,
        avatarUrl,
        statusMessage,
		externalSenderId,
	}: IFederationUserPresenceInputDto) {
        this.currentlyActive = currentlyActive;
        this.lastActiveAgo = lastActiveAgo;
        this.presence = presence;
        this.avatarUrl = avatarUrl;
        this.statusMessage = statusMessage;
        this.externalSenderId = externalSenderId;
	}

	currentlyActive: boolean;

	lastActiveAgo: number;

    externalSenderId: string;

    presence: UserStatus;

    statusMessage?: string;

    avatarUrl?: string;
};

interface IFederationUserTypingStatusInputDto extends IFederationReceiverBaseRoomInputDto {
	externalUserIdsTyping: string[];
}

export class FederationUserTypingStatusEventDto extends FederationBaseRoomInputDto {
	constructor({
		externalRoomId,
        normalizedRoomId,
        externalUserIdsTyping,
	}: IFederationUserTypingStatusInputDto) {
        super({ externalRoomId, normalizedRoomId, externalEventId: '' });
        this.externalRoomId = externalRoomId;
        this.normalizedRoomId = normalizedRoomId;
        this.externalUserIdsTyping = externalUserIdsTyping;
	}

	externalUserIdsTyping: string[];
};
