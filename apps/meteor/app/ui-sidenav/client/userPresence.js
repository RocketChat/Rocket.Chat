import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { Template } from 'meteor/templating';
import { Tracker } from 'meteor/tracker';

import { Presence } from '../../../client/lib/presence';

import './userPresence.html';

const data = new Map();
const options = {
	threshold: 0.1,
};

let lastEntries = [];
const handleEntries = function (entries) {
	lastEntries = entries.filter(({ isIntersecting }) => isIntersecting);
	lastEntries.forEach(async (entry) => {
		const { uid } = data.get(entry.target);
		Presence.get(uid);
	});
};

const featureExists = !!window.IntersectionObserver;

const observer = featureExists && new IntersectionObserver(handleEntries, options);

Tracker.autorun(() => {
	// Only clear statuses on disconnect, prevent process it on reconnect again
	const isConnected = Meteor.status().connected;
	if (!Meteor.userId() || !isConnected) {
		Presence.reset();
		return Meteor.users.update({ status: { $exists: true } }, { $unset: { status: true } }, { multi: true });
	}

	Presence.restart();

	if (featureExists) {
		for (const node of data.keys()) {
			observer.unobserve(node);
			observer.observe(node);
		}
		return;
	}

	Accounts.onLogout(() => {
		Presence.reset();
	});
});

Template.userPresence.onRendered(function () {
	if (!this.data || !this.data.uid) {
		return;
	}
	data.set(this.firstNode, this.data);
	if (featureExists) {
		return observer.observe(this.firstNode);
	}
});
