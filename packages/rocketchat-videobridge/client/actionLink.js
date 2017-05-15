import toastr from 'toastr';
RocketChat.actionLinks.register('joinJitsiCall', function(message, params, instance) {
	if (Session.get('openedRoom')) {
		const rid = Session.get('openedRoom');

		const room = RocketChat.models.Rooms.findOne({_id: rid});
		const currentTime = new Date().getTime();
		const jitsiTimeout = new Date((room && room.jitsiTimeout) || currentTime).getTime();

		if (jitsiTimeout > currentTime) {
			instance.tabBar.open('video');
		} else {
			toastr.info(TAPi18n.__('Call Already Ended', ''));
		}
	}
});
