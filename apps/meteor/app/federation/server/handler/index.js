import qs from 'querystring';

import { disabled } from '../functions/errors';
import { clientLogger } from '../lib/logger';
import { isFederationEnabled } from '../lib/isFederationEnabled';
import { federationRequestToPeer } from '../lib/http';

export async function federationSearchUsers(query) {
	if (!isFederationEnabled()) {
		throw disabled('client.searchUsers');
	}

	clientLogger.debug({ msg: 'searchUsers', query });

	const [username, peerDomain] = query.split('@');

	const uri = `/api/v1/federation.users.search?${qs.stringify({ username, domain: peerDomain })}`;

	const {
		data: { users },
	} = await federationRequestToPeer('GET', peerDomain, uri);

	return users;
}

export async function getUserByUsername(query) {
	if (!isFederationEnabled()) {
		throw disabled('client.searchUsers');
	}

	clientLogger.debug({ msg: 'getUserByUsername', query });

	const [username, peerDomain] = query.split('@');

	const uri = `/api/v1/federation.users.getByUsername?${qs.stringify({ username })}`;

	const {
		data: { user },
	} = await federationRequestToPeer('GET', peerDomain, uri);

	return user;
}

export async function requestEventsFromLatest(domain, fromDomain, contextType, contextQuery, latestEventIds) {
	if (!isFederationEnabled()) {
		throw disabled('client.requestEventsFromLatest');
	}

	clientLogger.debug({
		msg: 'requestEventsFromLatest',
		domain,
		contextType,
		contextQuery,
		latestEventIds,
	});

	const uri = '/api/v1/federation.events.requestFromLatest';

	await federationRequestToPeer('POST', domain, uri, {
		fromDomain,
		contextType,
		contextQuery,
		latestEventIds,
	});
}

export async function dispatchEvents(domains, events) {
	if (!isFederationEnabled()) {
		throw disabled('client.dispatchEvents');
	}

	domains = [...new Set(domains)];

	clientLogger.debug({ msg: 'dispatchEvents', domains, events });

	const uri = '/api/v1/federation.events.dispatch';

	for await (const domain of domains) {
		await federationRequestToPeer('POST', domain, uri, { events }, { ignoreErrors: true });
	}
}

export async function dispatchEvent(domains, event) {
	await dispatchEvents([...new Set(domains)], [event]);
}

export async function getUpload(domain, fileId) {
	const {
		data: { upload, buffer },
	} = await federationRequestToPeer('GET', domain, `/api/v1/federation.uploads?${qs.stringify({ upload_id: fileId })}`);

	return { upload, buffer: Buffer.from(buffer) };
}
