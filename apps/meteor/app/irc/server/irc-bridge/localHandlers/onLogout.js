export default async function handleOnLogout(user) {
	this.loggedInUsers = this.loggedInUsers.filter((value) => value !== user._id);

	this.sendCommand('disconnected', { user });
}
