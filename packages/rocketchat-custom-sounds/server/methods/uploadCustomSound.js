/* globals RocketChatFileCustomSoundsInstance */
Meteor.methods({
	uploadCustomSound(binaryContent, contentType, soundData) {
		if (!RocketChat.authz.hasPermission(this.userId, 'manage-sounds')) {
			throw new Meteor.Error('not_authorized');
		}

		const file = new Buffer(binaryContent, 'binary');

		const rs = RocketChatFile.bufferToStream(file);
		RocketChatFileCustomSoundsInstance.deleteFile(`${ soundData._id }.${ soundData.extension }`);
		const ws = RocketChatFileCustomSoundsInstance.createWriteStream(`${ soundData._id }.${ soundData.extension }`, contentType);
		ws.on('end', Meteor.bindEnvironment(() =>
			Meteor.setTimeout(() => RocketChat.Notifications.notifyAll('updateCustomSound', {soundData}), 500)
		));

		rs.pipe(ws);
	}
});
