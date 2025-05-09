import qs from 'querystring';

import { disabled } from '../functions/errors';
import { federationRequestToPeer } from '../lib/http';
import { isFederationEnabled } from '../lib/isFederationEnabled';
import { clientLogger } from '../lib/logger';

export async function federationSearchUsers(query: string) {
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

export async function getUserByUsername(query: string) {
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

export async function requestEventsFromLatest(
	domain: string,
	fromDomain: string,
	contextType: unknown,
	contextQuery: unknown,
	latestEventIds: unknown,
) {
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

export async function dispatchEvents(domains: string[], events: unknown[]) {
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

export async function dispatchEvent(domains: string[], event: unknown) {
	await dispatchEvents([...new Set(domains)], [event]);
}

export async function getUpload(domain: string, fileId: string) {
	const {
		data: { upload, buffer },
	} = await federationRequestToPeer('GET', domain, `/api/v1/federation.uploads?${qs.stringify({ upload_id: fileId })}`);

	return { upload, buffer: Buffer.from(buffer) };
}
