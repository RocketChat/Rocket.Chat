import qs from 'querystring';

import { disabled } from '../functions/errors';
import { logger } from '../lib/logger';
import { isFederationEnabled } from '../lib/isFederationEnabled';
import { federationRequestToPeer } from '../lib/http';

export function federationSearchUsers(query) {
	if (!isFederationEnabled()) {
		throw disabled('client.searchUsers');
	}

	logger.client.debug(() => `searchUsers => query=${ query }`);

	const [username, peerDomain] = query.split('@');

	const uri = `/api/v1/federation.users.search?${ qs.stringify({ username, domain: peerDomain }) }`;

	const { data: { users } } = federationRequestToPeer('GET', peerDomain, uri);

	return users;
}

export function getUserByUsername(query) {
	if (!isFederationEnabled()) {
		throw disabled('client.searchUsers');
	}

	logger.client.debug(() => `getUserByUsername => query=${ query }`);

	const [username, peerDomain] = query.split('@');

	const uri = `/api/v1/federation.users.getByUsername?${ qs.stringify({ username }) }`;

	const { data: { user } } = federationRequestToPeer('GET', peerDomain, uri);

	return user;
}

export function requestEventsFromLatest(domain, fromDomain, contextType, contextQuery, latestEventIds) {
	if (!isFederationEnabled()) {
		throw disabled('client.requestEventsFromLatest');
	}

	logger.client.debug(() => `requestEventsFromLatest => domain=${ domain } contextType=${ contextType } contextQuery=${ JSON.stringify(contextQuery, null, 2) } latestEventIds=${ latestEventIds.join(', ') }`);

	const uri = '/api/v1/federation.events.requestFromLatest';

	federationRequestToPeer('POST', domain, uri, { fromDomain, contextType, contextQuery, latestEventIds });
}


export function dispatchEvents(domains, events) {
	if (!isFederationEnabled()) {
		throw disabled('client.dispatchEvents');
	}

	domains = [...new Set(domains)];

	logger.client.debug(() => `dispatchEvents => domains=${ domains.join(', ') } events=${ events.map((e) => JSON.stringify(e, null, 2)) }`);

	const uri = '/api/v1/federation.events.dispatch';

	for (const domain of domains) {
		federationRequestToPeer('POST', domain, uri, { events }, { ignoreErrors: true });
	}
}

export function dispatchEvent(domains, event) {
	dispatchEvents([...new Set(domains)], [event]);
}

export function getUpload(domain, fileId) {
	const { data: { upload, buffer } } = federationRequestToPeer('GET', domain, `/api/v1/federation.uploads?${ qs.stringify({ upload_id: fileId }) }`);

	return { upload, buffer: Buffer.from(buffer) };
}
