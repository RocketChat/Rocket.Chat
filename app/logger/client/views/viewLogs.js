import _ from 'underscore';
import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Tracker } from 'meteor/tracker';

import { ansispan } from '../ansispan';
import { stdout } from '../viewLogs';
import { hasAllPermission } from '../../../authorization';
import { SideNav } from '../../../ui-utils/client';
import './viewLogs.html';
import './viewLogs.css';
import { APIClient } from '../../../utils/client';

const stdoutStreamer = new Meteor.Streamer('stdout');

Template.viewLogs.onCreated(async function() {
	const { queue } = await APIClient.v1.get('stdout.queue');
	(queue || []).forEach((item) => stdout.insert(item));
	stdoutStreamer.on('stdout', (item) => stdout.insert(item));
	this.atBottom = true;
});

Template.viewLogs.onDestroyed(() => {
	stdout.remove({});
	stdoutStreamer.removeListener('stdout');
});

Template.viewLogs.helpers({
	hasPermission() {
		return hasAllPermission('view-logs');
	},
	logs() {
		return stdout.find({}, { sort: { ts: 1 } });
	},
	ansispan,
});

Template.viewLogs.events({
	'click .new-logs'(event, instance) {
		instance.atBottom = true;
		instance.sendToBottomIfNecessary();
	},
});

Template.viewLogs.onRendered(function() {
	Tracker.afterFlush(() => {
		SideNav.setFlex('adminFlex');
		SideNav.openFlex();
	});

	const wrapper = this.find('.js-terminal');
	const newLogs = this.find('.js-new-logs');

	this.isAtBottom = (scrollThreshold) => {
		if (scrollThreshold == null) {
			scrollThreshold = 0;
		}
		if (wrapper.scrollTop + scrollThreshold >= wrapper.scrollHeight - wrapper.clientHeight) {
			newLogs.className = 'new-logs not';
			return true;
		}
		return false;
	};

	this.sendToBottom = () => {
		wrapper.scrollTop = wrapper.scrollHeight - wrapper.clientHeight;
		newLogs.className = 'new-logs not';
	};

	this.checkIfScrollIsAtBottom = () => {
		this.atBottom = this.isAtBottom(100);
	};

	this.sendToBottomIfNecessary = () => {
		if (this.atBottom === true && this.isAtBottom() !== true) {
			this.sendToBottom();
		} else if (this.atBottom === false) {
			newLogs.className = 'new-logs';
		}
	};

	this.sendToBottomIfNecessaryDebounced = _.debounce(this.sendToBottomIfNecessary, 10);
	this.sendToBottomIfNecessary();

	if (window.MutationObserver) {
		const observer = new MutationObserver((mutations) => {
			mutations.forEach(() => this.sendToBottomIfNecessaryDebounced());
		});
		observer.observe(wrapper, { childList: true });
	} else {
		wrapper.addEventListener('DOMSubtreeModified', () => this.sendToBottomIfNecessaryDebounced());
	}

	this.onWindowResize = () => {
		Meteor.defer(() => this.sendToBottomIfNecessaryDebounced());
	};
	window.addEventListener('resize', this.onWindowResize);

	wrapper.addEventListener('mousewheel', () => {
		this.atBottom = false;
		Meteor.defer(() => this.checkIfScrollIsAtBottom());
	});

	wrapper.addEventListener('wheel', () => {
		this.atBottom = false;
		Meteor.defer(() => this.checkIfScrollIsAtBottom());
	});

	wrapper.addEventListener('touchstart', () => {
		this.atBottom = false;
	});

	wrapper.addEventListener('touchend', () => {
		Meteor.defer(() => this.checkIfScrollIsAtBottom());
	});

	wrapper.addEventListener('scroll', () => {
		this.atBottom = false;
		Meteor.defer(() => this.checkIfScrollIsAtBottom());
	});
});
