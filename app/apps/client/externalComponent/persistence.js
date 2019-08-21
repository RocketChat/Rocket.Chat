import { Meteor } from 'meteor/meteor';

export function setItem(appId, key, value) {
	Meteor.call('externalComponentStorage:setItem', appId, key, value);
}

export function getItem(appId, key) {
	return new Promise((resolve, reject) => {
		Meteor.call('externalComponentStorage:getItem', appId, key, (error, result) => {
			if (error) {
				console.log(error);
				reject(new Error(error));
			} else {
				resolve(result);
			}
		});
	});
}

export function getAll(appId) {
	return new Promise((resolve, reject) => {
		Meteor.call('externalComponentStorage:getAll', appId, (error, result) => {
			if (error) {
				console.log(error);
				reject(new Error(error));
			} else {
				resolve(result);
			}
		});
	});
}

export function removeItem(appId, key) {
	Meteor.call('externalComponentStorage:removeItem', appId, key);
}


export function clear(appId) {
	Meteor.call('externalComponentStorage:clear', appId);
}
