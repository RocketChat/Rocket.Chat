webrtc = {
	stream: stream
}

stream.permissions.write(function(eventName) {
	console.log('stream.permissions.write', this.userId);
	return eventName == 'send' && this.userId;
});

stream.permissions.read(function(eventName) {
	console.log('stream.permissions.read', this.userId, eventName);
	return this.userId == eventName;
});

stream.on('send', function(data) {
	console.log('send', data);
	stream.emit(data.to, data);
});