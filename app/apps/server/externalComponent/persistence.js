import { Meteor } from 'meteor/meteor';

import { Apps } from '../orchestrator';

Meteor.methods({
	async 'externalComponentStorage:getItem'(appId, key) {
		if (!appId) {
			console.log('invalid appId!');
			return;
		}

		if (typeof key !== 'string') {
			throw new Error('The key must be an string.');
		}

		const { value } = Apps.getPersistenceModel().findOne({ appId, key });

		return value;
	},
	async 'externalComponentStorage:getAll'(appId) {
		if (!appId) {
			console.log('invalid appId!');
			return;
		}

		const allItems = Apps.getPersistenceModel().find({ appId }).fetch();

		return allItems.map(({ key, value }) => ({ key, value }));
	},
	'externalComponentStorage:setItem'(appId, key, value) {
		if (!appId) {
			console.log('invalid appId!');
			return;
		}

		if (typeof key !== 'string') {
			throw new Error('The key must be an string.');
		}

		Apps.getPersistenceModel().upsert({ appId, key }, { appId, key, value });
	},
	'externalComponentStorage:removeItem'(appId, key) {
		if (!appId) {
			console.log('invalid appId!');
			return;
		}

		if (typeof key !== 'string') {
			throw new Error('The key must be an string.');
		}

		Apps.getPersistenceModel().remove({ appId, key });
	},
	'externalComponentStorage:clear'(appId) {
		if (!appId) {
			console.log('invalid appId!');
			return;
		}

		Apps.getPersistenceModel().remove({ appId });
	},
});
