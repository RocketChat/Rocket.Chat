import React from 'react';
import { Meteor } from 'meteor/meteor';

import { Info as info } from '../../app/utils';
import { ServerContext } from '../contexts/ServerContext';

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

const contextValue = {
	info,
	absoluteUrl,
	callMethod,
};

export function ServerProvider({ children }) {
	return <ServerContext.Provider children={children} value={contextValue} />;
}
