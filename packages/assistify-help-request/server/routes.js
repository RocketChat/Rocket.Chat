/**
 * Restful API endpoints for interaction with external systems
 */

import {HelpRequestApi} from './api';

function keysToLowerCase(obj) {
	for (const prop in obj) {
		if (obj.hasOwnProperty(prop)) {
			if (typeof obj[prop] === 'object') {
				obj[prop] = keysToLowerCase(obj[prop]);
			}
			if (prop !== prop.toLowerCase()) {
				obj[prop.toLowerCase()] = obj[prop];
				delete obj[prop];
			}
		}
	}
	return obj;
}

function preProcessBody(body) {
	body = keysToLowerCase(body);
	// Extract properties from the load encapsulated in an additional REQUEST-object
	if (body.request) {
		for (const key in body.request) {
			if (Object.prototype.hasOwnProperty.call(body.request, key)) {
				body[key] = body.request[key];
			}
		}
		delete body.request;
	}

	//dereference references
	for (const key in body) {
		if (typeof body[key] === 'object') {
			for (const prop in body[key]) {
				if (prop === '%ref') {
					const refId = body[key][prop].replace(/\#/, '');
					body[key] = body['%heap'][refId]['%val'];
				}
			}
		}
	}
	delete body['%heap'];
}

RocketChat.API.v1.addRoute('assistify.helpDiscussion', {authRequired: true}, {
	/**
	 * Creates a room with an initial question and adds users who could possibly help
	 * @see packages\rocketchat-api\server\routes.coffee
	 * @return {*} statusCode 40x on error or  200 and information on the created room on success
	 */
	post() {

		// keysToLowerCase(this.bodyParams);
		preProcessBody(this.bodyParams);

		const api = new HelpRequestApi();
		try {
			HelpRequestApi.validateHelpDiscussionPostRequest(this.bodyParams);
		} catch (err) {
			console.log('Assistify rejected malformed request:', JSON.stringify(this.request.body, ' ', 2));
			throw new Meteor.Error(`Malformed request:${ JSON.stringify(err, ' ', 2) }`);
		}

		// if (!this.request.headers['X-Auth-Token'])) { //todo: Check authorization - or is this done by Restivus once setting another parameter?
		// 	return {statusCode: 401, message: "Authentication failed."};
		// }

		const creationResult = api.processHelpDiscussionPostRequest(this.bodyParams);

		return creationResult;
	}
});
