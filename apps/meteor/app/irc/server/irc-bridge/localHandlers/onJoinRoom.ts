import type { IRoom, IUser } from '@rocket.chat/core-typings';

export default async function handleOnJoinRoom(this: any, user: IUser, room: IRoom): Promise<void> {
	this.sendCommand('joinedChannel', { room, user });
}
