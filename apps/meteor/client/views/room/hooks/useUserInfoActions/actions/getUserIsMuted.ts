type MutedUser = {
	username?: string;
};

type MutedRoom = {
	ro?: boolean;
	unmuted?: string[];
	muted?: string[];
};

export const getUserIsMuted = (user: MutedUser, room: MutedRoom | undefined, _userCanPostReadonly: boolean): boolean | undefined => {
	if (room?.ro) {
		if (Array.isArray(room.unmuted) && room.unmuted.indexOf(user.username ?? '') !== -1) {
			return false;
		}

		return true;
	}

	return room && Array.isArray(room.muted) && room.muted.indexOf(user.username ?? '') > -1;
};
