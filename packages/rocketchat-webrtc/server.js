stream.permissions.write(function(eventName) {
	return eventName == 'send' && this.userId;
});

stream.permissions.read(function(eventName) {
	return this.userId == eventName;
});

stream.on('send', function(data) {
	stream.emit(data.to, data);
});