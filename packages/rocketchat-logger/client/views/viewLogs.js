import moment from 'moment';
// TODO: remove this globals
/* globals ansispan stdout readMessage*/
Template.viewLogs.onCreated(function() {
	this.subscribe('stdout');
	this.atBottom = true;
});

Template.viewLogs.helpers({
	hasPermission() {
		return RocketChat.authz.hasAllPermission('view-logs');
	},
	logs() {
		return stdout.find({}, {
			sort: {
				ts: 1
			}
		});
	},
	ansispan(string) {
		string = ansispan(string.replace(/\s/g, '&nbsp;').replace(/(\\n|\n)/g, '<br>'));
		string = string.replace(/(.\d{8}-\d\d:\d\d:\d\d\.\d\d\d\(?.{0,2}\)?)/, '<span class="terminal-time">$1</span>');
		return string;
	},
	formatTS(date) {
		return moment(date).format('YMMDD-HH:mm:ss.SSS(ZZ)');
	}
});

Template.viewLogs.events({
	'click .new-logs'() {
		Template.instance().atBottom = true;
		return Template.instance().sendToBottomIfNecessary();
	}
});

Template.viewLogs.onRendered(function() {

	const wrapper = this.find('.terminal');
	const wrapperUl = this.find('.terminal');
	const newLogs = this.find('.new-logs');
	const template = this;
	template.isAtBottom = (scrollThreshold) => {
		if (scrollThreshold == null) {
			scrollThreshold = 0;
		}
		if (wrapper.scrollTop + scrollThreshold >= wrapper.scrollHeight - wrapper.clientHeight) {
			newLogs.className = 'new-logs not';
			return true;
		}
		return false;
	};
	template.sendToBottom = () => {
		wrapper.scrollTop = wrapper.scrollHeight - wrapper.clientHeight;
		return newLogs.className = 'new-logs not';
	};
	template.checkIfScrollIsAtBottom = function() {
		template.atBottom = template.isAtBottom(100);
		readMessage.enable();
		return readMessage.read();
	};
	template.sendToBottomIfNecessary = () => {
		if (template.atBottom === true && template.isAtBottom() !== true) {
			return template.sendToBottom();
		} else if (template.atBottom === false) {
			return newLogs.className = 'new-logs';
		}
	};
	template.sendToBottomIfNecessaryDebounced = _.debounce(template.sendToBottomIfNecessary, 10);
	template.sendToBottomIfNecessary();
	if (window.MutationObserver == null) {
		wrapperUl.addEventListener('DOMSubtreeModified', () => template.sendToBottomIfNecessaryDebounced());
	} else {
		const observer = new MutationObserver((mutations) => {
			mutations.forEach(() => template.sendToBottomIfNecessaryDebounced());
		});
		observer.observe(wrapperUl, {
			childList: true
		});
	}
	template.onWindowResize = () => {
		Meteor.defer(() => {
			return template.sendToBottomIfNecessaryDebounced();
		});
	};
	window.addEventListener('resize', template.onWindowResize);
	wrapper.addEventListener('mousewheel', () => {
		template.atBottom = false;
		Meteor.defer(() => {
			return template.checkIfScrollIsAtBottom();
		});
	});
	wrapper.addEventListener('wheel', () => {
		template.atBottom = false;
		Meteor.defer(() => template.checkIfScrollIsAtBottom());
	});
	wrapper.addEventListener('touchstart', () => {
		template.atBottom = false;
	});
	wrapper.addEventListener('touchend', () => {
		Meteor.defer(() => {
			return template.checkIfScrollIsAtBottom();
		});
		Meteor.setTimeout(() => {
			return template.checkIfScrollIsAtBottom();
		}, 1000);
		Meteor.setTimeout(() => {
			return template.checkIfScrollIsAtBottom();
		}, 2000);
	});
	wrapper.addEventListener('scroll', () => {
		template.atBottom = false;
		Meteor.defer(() => template.checkIfScrollIsAtBottom());
	});
});
