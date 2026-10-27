import { Message, ClientSafeError } from '@rocket.chat/core-services';
import type { IRoom, IUser } from '@rocket.chat/core-typings';
import { isPublicRoom } from '@rocket.chat/core-typings';
import { Rooms, Subscriptions } from '@rocket.chat/models';
import { Match } from 'meteor/check';
import type { UpdateResult, Document } from 'mongodb';

import { RoomSettingsEnum } from '../../../../definition/IRoomTypeConfig';
import { settings } from '../../../settings';
import { isABACManagedRoom } from '../../authorization/isABACManagedRoom';
import { i18n } from '../../i18n';
import { notifyOnSubscriptionChangedByRoomId } from '../../notifyListener';
import { assertCanRemoveRoomAbacAttributes, removeRoomAbacAttributes } from '../removeRoomAbacAttributes';
import { roomCoordinator } from '../roomCoordinator';

export const assertAbacRoomStaysPrivate = (room: Pick<IRoom, 't' | 'abacAttributes'>, roomType: IRoom['t']): void => {
	if (isPublicRoom({ t: roomType }) && isABACManagedRoom(room)) {
		throw new ClientSafeError('error-action-not-allowed', 'Changing an ABAC managed private room to public is not allowed', {
			function: 'RocketChat.saveRoomType',
			action: 'Change_Room_Type',
		});
	}
};

export const saveRoomType = async function (
	rid: string,
	roomType: IRoom['t'],
	user: IUser,
	sendMessage = true,
): Promise<UpdateResult | Document> {
	if (!Match.test(rid, String)) {
		throw new ClientSafeError('invalid-room', 'Invalid room', {
			function: 'RocketChat.saveRoomType',
		});
	}
	if (roomType !== 'c' && roomType !== 'p') {
		throw new ClientSafeError('error-invalid-room-type', 'error-invalid-room-type', {
			function: 'RocketChat.saveRoomType',
			type: roomType,
		});
	}
	const room = await Rooms.findOneById(rid);
	if (room == null) {
		throw new ClientSafeError('error-invalid-room', 'error-invalid-room', {
			function: 'RocketChat.saveRoomType',
			_id: rid,
		});
	}

	if (!(await roomCoordinator.getRoomDirectives(room.t)?.allowRoomSettingChange(room, RoomSettingsEnum.TYPE))) {
		throw new ClientSafeError('error-direct-room', "Can't change type of direct rooms", {
			function: 'RocketChat.saveRoomType',
		});
	}

	assertAbacRoomStaysPrivate(room, roomType);

	if (isPublicRoom({ t: roomType })) {
		await assertCanRemoveRoomAbacAttributes(room, user);
	}

	const result = await Promise.all([Rooms.setTypeById(rid, roomType), Subscriptions.updateTypeByRoomId(rid, roomType)]);

	if (!result) {
		return result;
	}

	if (isPublicRoom({ t: roomType })) {
		await removeRoomAbacAttributes(room, user);
	}

	if (result[1]?.modifiedCount) {
		void notifyOnSubscriptionChangedByRoomId(rid);
	}

	if (sendMessage) {
		let message;
		if (roomType === 'c') {
			message = i18n.t('public', {
				lng: user?.language || settings.get('Language') || 'en',
			});
		} else {
			message = i18n.t('private', {
				lng: user?.language || settings.get('Language') || 'en',
			});
		}
		await Message.saveSystemMessage('room_changed_privacy', rid, message, user);
	}

	return result;
};
