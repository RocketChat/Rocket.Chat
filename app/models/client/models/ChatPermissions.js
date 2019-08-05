// import localforage from 'localforage';


import { CachedCollection } from '../../../ui-cached-collection';
// import { CONSTANTS, events } from '../../../emitter/client';

// const localforageGetItem = (name) => new Promise((resolve, reject) => {
// 	localforage.getItem(name, (error, data) => {
// 		if (error) {
// 			return reject(error);
// 		}
// 		resolve(data);
// 	});
// });

// const restore = async (name, version, updatedAt, collection) => {
// 	let newUpdatedAt = updatedAt;
// 	const data = await localforageGetItem(name);

// 	if (data.version < version) {
// 		return Promise.reject('version changed');
// 	}

// 	if (data.records.length <= 0) {
// 		return Promise.reject('no records found');
// 	}

// 	this.log(`${ data.records.length } records loaded from cache`);
// 	for (let index = 0, l = data.records.length, arr = data.records; index < l; index++) {
// 		const { _id, ...record } = arr[index];
// 		// callbacks.run(`cachedCollection-loadFromCache-${ this.name }`, record);
// 		collection.upsert({ _id }, record);

// 		if (!record._updatedAt) {
// 			return;
// 		}

// 		const _updatedAt = new Date(record._updatedAt);

// 		if (_updatedAt <= newUpdatedAt) {
// 			return;
// 		}

// 		newUpdatedAt = _updatedAt;
// 	}
// 	return newUpdatedAt;
// };

// events.on(CONSTANTS.OP.PERMISSION, () => {

// });

export const AuthzCachedCollection = new CachedCollection({
	name: 'permissions',
	eventType: 'onLogged',
});

export const ChatPermissions = AuthzCachedCollection.collection;
