import { hasPermissionAsync } from './hasPermission';
import { Subscriptions } from '../../../models/server/raw';
import { getValue } from '../../../settings/server/raw';

export const roomAccessValidators = [
	async function(room, user = {}) {
		if (room && room.t === 'c') {
			const anonymous = await getValue('Accounts_AllowAnonymousRead');
			if (!user._id && anonymous === true) {
				return true;
			}

			return hasPermissionAsync(user._id, 'view-c-room');
		}
	},
	async function(room, user) {
		if (!room || !user) {
			return;
		}

		const subscription = await Subscriptions.findOneByRoomIdAndUserId(room._id, user._id);
		if (subscription) {
			return true;
		}
	},
];

export const canAccessRoomAsync = async (room, user, extraData) => {
	for (let i = 0, total = roomAccessValidators.length; i < total; i++) {
		// eslint-disable-next-line no-await-in-loop
		const permitted = await roomAccessValidators[i](room, user, extraData);
		if (permitted) {
			return true;
		}
	}
};

export const canAccessRoom = (room, user, extraData) => Promise.await(canAccessRoomAsync(room, user, extraData));

export const addRoomAccessValidator = (validator) => roomAccessValidators.push(validator.bind(this));
