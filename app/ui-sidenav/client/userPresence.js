import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { Template } from 'meteor/templating';
import { Tracker } from 'meteor/tracker';
import _ from 'underscore';
import mem from 'mem';

import { APIClient } from '../../utils/client';
import { saveUser, interestedUserIds } from '../../../imports/startup/client/listenActiveUsers';

import './userPresence.html';

const data = new Map();
const promises = new Map();
const pending = new Map();

const getAll = _.debounce(async function getAll() {
	const ids = Array.from(pending.keys());

	if (ids.length === 0) {
		return;
	}

	const params = {
		ids,
	};

	try {
		const {
			users,
		} = await APIClient.v1.get('users.presence', params);

		users.forEach((user) => saveUser(user, true));

		ids.forEach((id) => {
			const { resolve } = promises.get(id);
			resolve();
		});
	} catch (e) {
		ids.forEach((id) => {
			const { reject } = promises.get(id);
			reject();
		});
	}
}, 1000);

const get = mem(function get(id) {
	interestedUserIds.add(id);
	const promise = pending.get(id) || new Promise((resolve, reject) => {
		promises.set(id, { resolve, reject });
	});
	pending.set(id, promise);
	return promise;
});

const options = {
	threshold: 0.1,
};

let lastEntries = [];
const handleEntries = function(entries) {
	lastEntries = entries.filter(({ isIntersecting }) => isIntersecting);
	lastEntries.forEach(async (entry) => {
		const { uid } = data.get(entry.target);
		await get(uid);
		pending.delete(uid);
	});
	getAll();
};

const featureExists = !!window.IntersectionObserver;

const observer = featureExists && new IntersectionObserver(handleEntries, options);

let wasConnected = Meteor.status().connected;

Tracker.autorun(() => {
	// Only clear statuses on disconnect, prevent process it on reconnect again
	const isConnected = Meteor.status().connected;
	if (!Meteor.userId() || (wasConnected && !isConnected)) {
		wasConnected = isConnected;
		return Meteor.users.update({ status: { $exists: true } }, { $unset: { status: true } }, { multi: true });
	}
	mem.clear(get);
	wasConnected = isConnected;

	if (featureExists) {
		for (const node of data.keys()) {
			observer.unobserve(node);
			observer.observe(node);
		}
		return;
	}
	getAll();

	Accounts.onLogout(() => {
		interestedUserIds.clear();
	});
});

Template.userPresence.onRendered(function() {
	if (!this.data || !this.data.uid) {
		return;
	}
	data.set(this.firstNode, this.data);
	if (featureExists) {
		return observer.observe(this.firstNode);
	}
});
