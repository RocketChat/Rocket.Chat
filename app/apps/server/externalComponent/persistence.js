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

		console.log(Apps.getPersistenceModel().find({ appId }));
	},
	async 'externalComponentStorage:setItem'(appId, key, value) {
		if (!appId) {
			console.log('invalid appId!');
			return;
		}

		if (typeof key !== 'string') {
			throw new Error('The key must be an string.');
		}

		return Apps.getPersistenceModel().upsert({ appId, key }, { appId, key, value });
	},
	async 'externalComponentStorage:removeItem'(appId, key) {
		if (!appId) {
			console.log('invalid appId!');
			return;
		}

		if (typeof key !== 'string') {
			throw new Error('The key must be an string.');
		}

		return Apps.getPersistenceModel().remove({ appId, key });
	},
	async 'externalComponentStorage:clear'(appId) {
		if (!appId) {
			console.log('invalid appId!');
			return;
		}

		return Apps.getPersistenceModel().remove({ appId });
	},
});
