import _ from 'underscore';

export default async function handleOnLogout(user) {
	this.loggedInUsers = _.without(this.loggedInUsers, user._id);

	this.sendCommand('disconnected', { user });
}
