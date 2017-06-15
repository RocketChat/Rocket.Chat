/* globals Deps, UserPresence */

var timer, status;

UserPresence = {
	awayTime: 30000, //1 minute
	awayOnWindowBlur: false,
	callbacks: [],

	/**
	 * The callback will receive the following parameters: user, status
	 */
	onSetUserStatus: function(callback) {
		this.callbacks.push(callback);
	},

	runCallbacks: function(user, status) {
		this.callbacks.forEach(function(callback) {
			callback.call(null, user, status);
		});
	},

	startTimer: function() {
		UserPresence.stopTimer();
		timer = setTimeout(UserPresence.setAway, UserPresence.awayTime);
	},
	stopTimer: function() {
		clearTimeout(timer);
	},
	restartTimer: function() {
		UserPresence.startTimer();
	},
	setAway: function() {
		if (status !== 'away') {
			status = 'away';
			Meteor.call('UserPresence:away');
		}
		UserPresence.stopTimer();
	},
	setOnline: _.throttle(function() {
		if (status !== 'online') {
			const oldstatus = status;
			status = 'online';
			console.log('setting status to online. Current status is', oldstatus);
			Meteor.call('UserPresence:online');
		}
		UserPresence.startTimer();
	}, 200),
	start: function() {
		Deps.autorun(function() {
			var user = Meteor.user();
			status = user && user.statusConnection;
			UserPresence.startTimer();
		});

		Meteor.methods({
			'UserPresence:setDefaultStatus': function(status) {
				Meteor.users.update({_id: Meteor.userId()}, {$set: {status: status, statusDefault: status}});
			},
			'UserPresence:online': function() {
				var user = Meteor.user();
				console.log('calling online method. User is', user);
				if (user && user.statusDefault === 'online') {
					Meteor.users.update({_id: Meteor.userId()}, {$set: {status: 'online'}});
				}
				UserPresence.runCallbacks(user, 'online');
			},
			'UserPresence:away': function() {
				var user = Meteor.user();
				UserPresence.runCallbacks(user, 'away');
			}
		});

		document.addEventListener('mousemove', UserPresence.setOnline);
		document.addEventListener('mousedown', UserPresence.setOnline);
		document.addEventListener('touchend', UserPresence.setOnline);
		document.addEventListener('keydown', UserPresence.setOnline);
		window.addEventListener('focus', UserPresence.setOnline);

		if (UserPresence.awayOnWindowBlur === true) {
			window.addEventListener('blur', UserPresence.setAway);
		}
	}
};
