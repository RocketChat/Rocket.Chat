const commandStream = new Meteor.Streamer('client-commands');
this.commandStream = commandStream;

commandStream.allowWrite('none');

commandStream.allowRead(function(eventName) {
	if (eventName === this.userId) {
		return true;
	}
	return false;
});
