RocketChat.settings.addGroup('WebRTC', function() {
	this.add('WebRTC_Enable_Channel', false, {
		type: 'boolean',
		group: 'WebRTC',
		'public': true
	});
	this.add('WebRTC_Enable_Private', true, {
		type: 'boolean',
		group: 'WebRTC',
		'public': true
	});
	this.add('WebRTC_Enable_Direct', true, {
		type: 'boolean',
		group: 'WebRTC',
		'public': true
	});
	return this.add('WebRTC_Servers', 'stun:stun.l.google.com:19302, stun:23.21.150.121, team%40rocket.chat:demo@turn:numb.viagenie.ca:3478', {
		type: 'string',
		group: 'WebRTC',
		'public': true
	});
});
