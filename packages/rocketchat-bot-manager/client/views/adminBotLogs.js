import _ from 'underscore';
// TODO: remove this globals
/* globals readMessage*/

Template.adminBotLogs.onCreated(function() {
	this.logs = new ReactiveVar([]);
	this.bot = new ReactiveVar();
	this.autorun(() => {
		const username = this.data && this.data.params && this.data.params().username;

		if (username) {
			const sub = this.subscribe('fullUserData', username, 1);
			if (sub.ready()) {
				let bot;

				if (RocketChat.authz.hasAllPermission('manage-bot-account')) {
					bot = Meteor.users.findOne({ username });
				}

				if (bot) {
					this.bot.set(bot);
				} else {
					FlowRouter.go('admin-bots');
				}
			}
		}
	});

	this.autorun(() => {
		const bot = this.bot.get();
		if (bot) {
			Meteor.call('getLogs', bot, (err, logs) => {
				if (err) {
					return handleError(err);
				}
				this.logs.set(logs);
			});
		}
	});
	return this.atBottom = true;
});

Template.adminBotLogs.helpers({
	hasPermission() {
		return RocketChat.authz.hasAllPermission('manage-bot-account');
	},
	logs() {
		return Template.instance().logs.get();
	},
	getUsername() {
		return Template.instance().data.params().username;
	}
});

Template.adminBotLogs.events({
	'click .new-logs'() {
		Template.instance().atBottom = true;
		return Template.instance().sendToBottomIfNecessary();
	}
});

Template.adminBotLogs.onRendered(function() {

	const wrapper = this.find('.terminal');
	const wrapperUl = this.find('.terminal');
	const newLogs = this.find('.new-logs');
	const template = this;
	template.isAtBottom = function(scrollThreshold) {
		if (scrollThreshold == null) {
			scrollThreshold = 0;
		}
		if (wrapper.scrollTop + scrollThreshold >= wrapper.scrollHeight - wrapper.clientHeight) {
			newLogs.className = 'new-logs not';
			return true;
		}
		return false;
	};
	template.sendToBottom = function() {
		wrapper.scrollTop = wrapper.scrollHeight - wrapper.clientHeight;
		return newLogs.className = 'new-logs not';
	};
	template.checkIfScrollIsAtBottom = function() {
		template.atBottom = template.isAtBottom(100);
		readMessage.enable();
		return readMessage.read();
	};
	template.sendToBottomIfNecessary = function() {
		if (template.atBottom === true && template.isAtBottom() !== true) {
			return template.sendToBottom();
		} else if (template.atBottom === false) {
			return newLogs.className = 'new-logs';
		}
	};
	template.sendToBottomIfNecessaryDebounced = _.debounce(template.sendToBottomIfNecessary, 10);
	template.sendToBottomIfNecessary();
	if (window.MutationObserver == null) {
		wrapperUl.addEventListener('DOMSubtreeModified', function() {
			return template.sendToBottomIfNecessaryDebounced();
		});
	} else {
		const observer = new MutationObserver(function(mutations) {
			return mutations.forEach(function() {
				return template.sendToBottomIfNecessaryDebounced();
			});
		});
		observer.observe(wrapperUl, {
			childList: true
		});
	}
	template.onWindowResize = function() {
		return Meteor.defer(function() {
			return template.sendToBottomIfNecessaryDebounced();
		});
	};
	window.addEventListener('resize', template.onWindowResize);
	wrapper.addEventListener('mousewheel', function() {
		template.atBottom = false;
		return Meteor.defer(function() {
			return template.checkIfScrollIsAtBottom();
		});
	});
	wrapper.addEventListener('wheel', function() {
		template.atBottom = false;
		return Meteor.defer(function() {
			return template.checkIfScrollIsAtBottom();
		});
	});
	wrapper.addEventListener('touchstart', function() {
		return template.atBottom = false;
	});
	wrapper.addEventListener('touchend', function() {
		Meteor.defer(function() {
			return template.checkIfScrollIsAtBottom();
		});
		Meteor.setTimeout(function() {
			return template.checkIfScrollIsAtBottom();
		}, 1000);
		return Meteor.setTimeout(function() {
			return template.checkIfScrollIsAtBottom();
		}, 2000);
	});
	return wrapper.addEventListener('scroll', function() {
		template.atBottom = false;
		return Meteor.defer(function() {
			return template.checkIfScrollIsAtBottom();
		});
	});
});
