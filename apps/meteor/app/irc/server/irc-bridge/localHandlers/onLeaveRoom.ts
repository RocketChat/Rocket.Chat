import type { IRoom, IUser } from '@rocket.chat/core-typings';

export default async function handleOnLeaveRoom(this: any, user: IUser, room: IRoom): Promise<void> {
	this.sendCommand('leftChannel', { room, user });
}
