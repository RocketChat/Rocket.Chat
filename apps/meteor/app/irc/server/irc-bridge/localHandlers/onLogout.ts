import type { IUser } from '@rocket.chat/core-typings';
import _ from 'underscore';

export default async function handleOnLogout(this: any, user: IUser): Promise<void> {
	this.loggedInUsers = _.without(this.loggedInUsers, user._id);

	this.sendCommand('disconnected', { user });
}
