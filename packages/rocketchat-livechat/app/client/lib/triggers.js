this.Triggers = (function() {
	var triggers = [];

	var init = function() {
		Tracker.autorun(function() {
			triggers = Trigger.find().fetch();
		});
	};

	var fire = function(actions) {
		if (Meteor.userId()) {
			console.log('already logged user - does nothing');
			return;
		}
		actions.forEach(function(action) {
			if (action.name === 'send-message') {
				var room = Random.id();
				visitor.setRoom(room);

				Session.set('triggered', true);
				ChatMessage.insert({
					msg: action.params.msg,
					rid: room,
					u: {
						username: action.params.name
					}
				});

				parentCall('openWidget');
			}
		});
	};

	var processRequest = function(request) {
		triggers.forEach(function(trigger) {
			trigger.conditions.forEach(function(condition) {
				switch (condition.name) {
					case 'page-url':
						if (request.href.match(new RegExp(urlRegex))) {
							fire(trigger.actions);
						}
						break;

					case 'time-on-site':
						if (trigger.timeout) {
							clearTimeout(trigger.timeout);
						}
						trigger.timeout = setTimeout(function() {
							fire(trigger.actions);
						}, parseInt(condition.value) * 1000);
						break;
				}
			});
		});
	};

	return {
		init: init,
		processRequest: processRequest
	};
})();
