import type { IRoom, IUser } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';

export default async function handleOnCreateRoom(this: any, _user: IUser, room: IRoom): Promise<void> {
	const users = await Users.findByRoomId(room._id);

	void users.forEach((user) => {
		if ((user as any).profile?.irc?.fromIRC) {
			this.sendCommand('joinChannel', { room, user });
		} else {
			this.sendCommand('joinedChannel', { room, user });
		}
	});
}
