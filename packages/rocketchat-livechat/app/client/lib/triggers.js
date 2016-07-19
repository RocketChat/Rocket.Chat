this.Triggers = (function() {
	var triggers = [];
	var initiated = false;
	var requests = [];
	var enabled = true;

	var fire = function(actions) {
		if (!enabled || Meteor.userId()) {
			return;
		}
		actions.forEach(function(action) {
			if (action.name === 'send-message') {
				var roomId = visitor.getRoom();

				if (!roomId) {
					roomId = Random.id();
					visitor.setRoom(roomId);
				}

				Session.set('triggered', true);
				ChatMessage.insert({
					msg: action.params.msg,
					rid: roomId,
					u: {
						username: action.params.name
					}
				});

				parentCall('openWidget');
			}
		});
	};

	var processRequest = function(request) {
		if (!initiated) {
			return requests.push(request);
		}
		triggers.forEach(function(trigger) {
			trigger.conditions.forEach(function(condition) {
				switch (condition.name) {
					case 'page-url':
						if (request.location.href.match(new RegExp(condition.value))) {
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

	var setTriggers = function(newTriggers) {
		triggers = newTriggers;
	};

	var init = function() {
		initiated = true;

		if (requests.length > 0 && triggers.length > 0) {
			requests.forEach(function(request) {
				processRequest(request);
			});

			requests = [];
		}
	};

	var setDisabled = function() {
		enabled = false;
	};

	var setEnabled = function() {
		enabled = true;
	};

	return {
		init: init,
		processRequest: processRequest,
		setTriggers: setTriggers,
		setDisabled: setDisabled,
		setEnabled: setEnabled
	};
}());
