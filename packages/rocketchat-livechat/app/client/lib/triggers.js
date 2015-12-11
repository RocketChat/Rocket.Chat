this.Triggers = (function() {
	var urlRegex = null;
	var time = null;
	var message = 'Default trigger message';

	var timeout = null;

	var init = function() {
		console.log('init!!');
		Tracker.autorun(function() {
			var trigger = Trigger.findOne();
			console.log('trigger found ->',trigger);
			if (trigger) {
				urlRegex = trigger.urlRegex;
				time = trigger.time;
				message = trigger.message;
			}
		});
	};

	var fire = function() {
		if (Meteor.userId()) {
			console.log('already logged user - does nothing');
			return;
		}
		parentCall('triggerMessage', message);

		var room = Random.id();
		visitor.setRoom(room);

		Session.set('triggered', true);
		ChatMessage.insert({
			msg: message,
			rid: room,
			u: {
				username: 'random-agent'
			}
		});
	};

	var processRequest = function(request) {
		if (urlRegex && urlRegex !== '') {
			if (request.href.match(urlRegex)) {
				fire();
			}
		}

		if (time) {
			console.log('registerTimeout ->',time);
			clearTimeout(timeout);
			timeout = setTimeout(function() {
				fire();
			}, time * 1000);
		}
	};

	return {
		init: init,
		processRequest: processRequest
	};
})();
