import toastr from 'toastr';
RocketChat.actionLinks.register('joinJitsiCall', function(message, params, instance) {
	if (Session.get('openedRoom')) {
		let rid = Session.get('openedRoom');

		let room = RocketChat.models.Rooms.findOne({_id: rid});
		let currentTime = new Date().getTime();
		let jitsiTimeout = new Date((room && room.jitsiTimeout) || currentTime).getTime();

		if (jitsiTimeout > currentTime) {
			instance.tabBar.open('video');
		} else {
			toastr.info(TAPi18n.__('Call Already Ended', ''));
		}
	}
});
