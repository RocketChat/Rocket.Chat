import { settings } from '/app/settings';
import { Subscriptions } from '/app/models';
import { hasPermission } from './hasPermission';

export const roomAccessValidators = [
	function(room, user = {}) {
		if (room && room.t === 'c') {
			if (!user._id && settings.get('Accounts_AllowAnonymousRead') === true) {
				return true;
			}

			return hasPermission(user._id, 'view-c-room');
		}
	},
	function(room, user) {
		if (!room || !user) {
			return;
		}

		const subscription = Subscriptions.findOneByRoomIdAndUserId(room._id, user._id);
		if (subscription) {
			return true;
		}
	},
];

export const canAccessRoom = (room, user, extraData) => roomAccessValidators.some((validator) => validator(room, user, extraData));

export const addRoomAccessValidator = (validator) => roomAccessValidators.push(validator.bind(this));
