import React from 'react';
import { Meteor } from 'meteor/meteor';

import { Info as info } from '../../app/utils';
import { ServerContext } from '../contexts/ServerContext';
import { APIClient } from '../../app/utils/client';

const absoluteUrl = (path) => Meteor.absoluteUrl(path);

const callMethod = (methodName, ...args) => new Promise((resolve, reject) => {
	Meteor.call(methodName, ...args, (error, result) => {
		if (error) {
			reject(error);
			return;
		}

		resolve(result);
	});
});

const callEndpoint = (httpMethod, endpoint, ...args) => {
	const allowedHttpMethods = ['get', 'post', 'delete'];
	if (!httpMethod || !allowedHttpMethods.includes(httpMethod.toLowerCase())) {
		throw new Error('Invalid http method provided to "useEndpoint"');
	}
	if (!endpoint) {
		throw new Error('Invalid endpoint provided to "useEndpoint"');
	}

	if (endpoint[0] === '/') {
		return APIClient[httpMethod.toLowerCase()](endpoint.slice(1), ...args);
	}

	return APIClient.v1[httpMethod.toLowerCase()](endpoint, ...args);
};

const uploadToEndpoint = (endpoint, params, formData) => {
	if (endpoint[0] === '/') {
		return APIClient.upload(endpoint.slice(1), params, formData).promise;
	}

	return APIClient.v1.upload(endpoint, params, formData).promise;
};

const getStream = (streamName, options = {}) => new Meteor.Streamer(streamName, options);

const contextValue = {
	info,
	absoluteUrl,
	callMethod,
	callEndpoint,
	uploadToEndpoint,
	getStream,
};

export function ServerProvider({ children }) {
	return <ServerContext.Provider children={children} value={contextValue} />;
}
