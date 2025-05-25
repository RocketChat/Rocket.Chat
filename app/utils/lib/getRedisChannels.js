export const getRedisChannels = (rid) => {
	const channels = [];
	if (rid.length !== 34) {
		channels.push(`room-${rid}`);
	} else {
		channels.push(`user-${rid.slice(0, 17)}`);
		channels.push(`user-${rid.slice(17)}`);
	}
	return channels;
};
