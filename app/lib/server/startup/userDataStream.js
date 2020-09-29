import { MongoInternals } from 'meteor/mongo';

import { Users } from '../../../models/server';
import { Notifications } from '../../../notifications/server';
import loginServiceConfiguration from '../../../models/server/models/LoginServiceConfiguration';

let processOnChange;
// eslint-disable-next-line no-undef
const disableOplog = Package['disable-oplog'];

if (disableOplog) {
	// Stores the callbacks for the disconnection reactivity bellow
	const userCallbacks = new Map();
	const serviceConfigCallbacks = new Set();

	// Overrides the native observe changes to prevent database polling and stores the callbacks
	// for the users' tokens to re-implement the reactivity based on our database listeners
	const { mongo } = MongoInternals.defaultRemoteCollectionDriver();
	MongoInternals.Connection.prototype._observeChanges = function({ collectionName, selector, options = {} }, _ordered, callbacks) {
		// console.error('Connection.Collection.prototype._observeChanges', collectionName, selector, options);
		let cbs;
		if (callbacks?.added) {
			const records = Promise.await(mongo.rawCollection(collectionName).find(selector, { projection: options.fields }).toArray());
			for (const { _id, ...fields } of records) {
				callbacks.added(_id, fields);
			}

			if (collectionName === 'users' && selector['services.resume.loginTokens.hashedToken']) {
				cbs = userCallbacks.get(selector._id) || new Set();
				cbs.add({
					hashedToken: selector['services.resume.loginTokens.hashedToken'],
					callbacks,
				});
				userCallbacks.set(selector._id, cbs);
			}
		}

		if (collectionName === 'meteor_accounts_loginServiceConfiguration') {
			serviceConfigCallbacks.add(callbacks);
		}

		return {
			stop() {
				if (cbs) {
					cbs.delete(callbacks);
				}
				serviceConfigCallbacks.delete(callbacks);
			},
		};
	};

	// Re-implement meteor's reactivity that uses observe to disconnect sessions when the token
	// associated was removed
	processOnChange = (diff, id) => {
		const loginTokens = diff['services.resume.loginTokens'];
		if (loginTokens) {
			const tokens = loginTokens.map(({ hashedToken }) => hashedToken);

			const cbs = userCallbacks.get(id);
			if (cbs) {
				[...cbs].filter(({ hashedToken }) => !tokens.includes(hashedToken)).forEach((item) => {
					item.callbacks.removed(id);
					cbs.delete(item);
				});
			}
		}
	};

	loginServiceConfiguration.on('change', ({ clientAction, id, data, diff }) => {
		switch (clientAction) {
			case 'inserted':
			case 'updated':
				const record = { ...data || diff };
				delete record.secret;
				serviceConfigCallbacks.forEach((callbacks) => {
					callbacks[clientAction === 'inserted' ? 'added' : 'changed']?.(id, record);
				});
				break;
			case 'removed':
				serviceConfigCallbacks.forEach((callbacks) => {
					callbacks.removed?.(id);
				});
		}
	});
}

Users.on('change', ({ clientAction, id, data, diff }) => {
	switch (clientAction) {
		case 'updated':
			Notifications.notifyUserInThisInstance(id, 'userData', { diff, type: clientAction });

			if (disableOplog) {
				processOnChange(diff, id);
			}

			break;
		case 'inserted':
			Notifications.notifyUserInThisInstance(id, 'userData', { data, type: clientAction });
			break;
		case 'removed':
			Notifications.notifyUserInThisInstance(id, 'userData', { id, type: clientAction });
			break;
	}
});
