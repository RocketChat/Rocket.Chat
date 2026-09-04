type MutedUser = {
	username?: string;
};

type MutedRoom = {
	ro?: boolean;
	unmuted?: string[];
	muted?: string[];
};

export const getUserIsMuted = (user: MutedUser, room: MutedRoom | undefined, userCanPostReadonly: boolean): boolean | undefined => {
	const username = user.username ?? '';

	if (room?.ro) {
		if (Array.isArray(room.unmuted) && room.unmuted.indexOf(username) !== -1) {
			return false;
		}

		if (userCanPostReadonly) {
			const roomHasNoMutedList = !Array.isArray(room.muted) || room.muted.length === 0;

			return roomHasNoMutedList || room.muted.indexOf(username) !== -1;
		}

		return true;
	}

	return room && Array.isArray(room.muted) && room.muted.indexOf(username) > -1;
};
