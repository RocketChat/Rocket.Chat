import type { ServerContextValue } from '@rocket.chat/ui-contexts';
import { ServerContext, useSDK } from '@rocket.chat/ui-contexts';
import { Meteor } from 'meteor/meteor';
import { compile } from 'path-to-regexp';
import type { ReactNode } from 'react';
import React, { useMemo } from 'react';

import { Info as info } from '../../app/utils/rocketchat.info';

type ServerProviderProps = { children?: ReactNode };

const ServerProvider = ({ children }: ServerProviderProps) => {
	const sdk = useSDK();

	const contextValue = useMemo((): ServerContextValue => {
		const absoluteUrl: ServerContextValue['absoluteUrl'] = (path) => Meteor.absoluteUrl(path);

		const callMethod: ServerContextValue['callMethod'] = (methodName, ...args) => sdk.call(methodName, ...args);

		const callEndpoint: ServerContextValue['callEndpoint'] = ({ method, pathPattern, keys, params }) => {
			const compiledPath = compile(pathPattern, { encode: encodeURIComponent })(keys) as any;

			switch (method) {
				case 'GET':
					return sdk.rest.get(compiledPath, params as any) as any;

				case 'POST':
					return sdk.rest.post(compiledPath, params as any) as any;

				case 'PUT':
					return sdk.rest.put(compiledPath, params as never) as never;

				case 'DELETE':
					return sdk.rest.delete(compiledPath, params as any) as any;

				default:
					throw new Error('Invalid HTTP method');
			}
		};

		const uploadToEndpoint: ServerContextValue['uploadToEndpoint'] = (endpoint, formData) => sdk.rest.post(endpoint as any, formData);

		const getStream: ServerContextValue['getStream'] = (streamName, _options) => (eventName, callback) =>
			sdk.stream(streamName, [eventName], callback).stop;

		return {
			info,
			absoluteUrl,
			callMethod,
			callEndpoint,
			uploadToEndpoint,
			getStream,
		};
	}, [sdk]);

	return <ServerContext.Provider children={children} value={contextValue} />;
};

export default ServerProvider;
