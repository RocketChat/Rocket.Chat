import type { IncomingMessage, ServerResponse } from 'http';

import type { IIncomingMessage } from '@rocket.chat/core-typings';
import bodyParser from 'body-parser';
import { Meteor } from 'meteor/meteor';
import { RoutePolicy } from 'meteor/routepolicy';
import { WebApp } from 'meteor/webapp';

import { SystemLogger } from '../../../server/lib/logger/system';
import type { ISAMLAction } from './definition/ISAMLAction';
import { SAML } from './lib/SAML';
import { SAMLUtils } from './lib/Utils';

RoutePolicy.declare('/_saml/', 'network');

const samlUrlToObject = function (url: string | undefined): ISAMLAction | null {
	// req.url will be '/_saml/<action>/<service name>/<credentialToken>'
	if (!url) {
		return null;
	}

	const splitUrl = url.split('?');
	const splitPath = splitUrl[0].split('/');

	// Any non-saml request will continue down the default
	// middlewares.
	if (splitPath[1] !== '_saml') {
		return null;
	}

	const result = {
		actionName: splitPath[2],
		serviceName: splitPath[3],
		credentialToken: splitPath[4],
	};

	SAMLUtils.log(result);
	return result;
};

const middleware = async function (req: IIncomingMessage, res: ServerResponse, next: (err?: any) => void): Promise<void> {
	// Make sure to catch any exceptions because otherwise we'd crash
	// the runner
	try {
		const samlObject = samlUrlToObject(req.url);
		if (!samlObject?.serviceName) {
			next();
			return;
		}

		if (!samlObject.actionName) {
			throw new Error('Missing SAML action');
		}

		const service = SAMLUtils.getServiceProviderOptions(samlObject.serviceName);
		if (!service) {
			SystemLogger.error(`${samlObject.serviceName} service provider not found`);
			throw new Error('SAML Service Provider not found.');
		}

		await SAML.processRequest(req, res, service, samlObject);
	} catch (err) {
		// @ToDo: Ideally we should send some error message to the client, but there's no way to do it on a redirect right now.
		SystemLogger.error(err);

		const url = Meteor.absoluteUrl('home');
		res.writeHead(302, {
			Location: url,
		});
		res.end();
	}
};

// Listen to incoming SAML http requests
WebApp.connectHandlers
	.use(bodyParser.json())
	.use(async (req: IncomingMessage, res: ServerResponse, next: (err?: any) => void) => middleware(req as IIncomingMessage, res, next));
