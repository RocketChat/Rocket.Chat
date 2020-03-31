import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { APIClient } from '../../app/utils/client';

Meteor.call = function _meteorCallOverREST(method: string, ...params: any): void {
	const endpoint = Tracker.nonreactive(() => (!Meteor.userId() ? 'method.callAnon' : 'method.call'));

	const restParams = {
		method,
		params,
	};

	let callback = params.pop();
	if (typeof callback !== 'function') {
		params.push(callback);
		callback = (): void => {
			// empty
		};
	}

	// not using async to not change Meteor.call return type
	APIClient.v1.post(endpoint, restParams)
		.then(({ result }) => callback(null, result))
		.catch((error) => callback(error));
};
