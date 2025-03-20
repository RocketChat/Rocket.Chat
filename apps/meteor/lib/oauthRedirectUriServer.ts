import { OAuth } from 'meteor/oauth';

import { SystemLogger } from '../server/lib/logger/system';

const { _redirectUri } = OAuth;

OAuth._redirectUri = (serviceName, config, params, absoluteUrlOptions) => {
	const ret = _redirectUri(serviceName, config, params, absoluteUrlOptions);

	// DEPRECATED: Remove in v5.0.0
	// Meteor 2.3 removed ?close from redirect uri so we need to add it back to not break old oauth clients
	// https://github.com/meteor/meteor/commit/b5b7306bedc3e8eb241e64efb1e281925aa75dd3#diff-59244f4e0176cb1beed2e287924e97dc7ae2c0cc51494ce121a85d8937d116a5L11
	if (!config?.loginStyle && !ret.includes('close')) {
		SystemLogger.warn(
			`Automatically added ?close to 'redirect_uri' for ${serviceName}, this behavior will be removed in v5.0.0.\n` +
				"Please update your OAuth config to accept both with and without ?close as the 'redirect_uri'.",
		);
		return `${ret + (ret.includes('?') ? '&' : '?')}close`;
	}

	return ret;
};
