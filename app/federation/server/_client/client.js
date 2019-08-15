import qs from 'querystring';

import { logger } from '../logger';
import { Federation } from '../federation';

// Callbacks
import './callbacks/afterCreateDirectRoom';
import './callbacks/afterDeleteMessage';
import './callbacks/afterDeleteRoom';
import './callbacks/afterSaveMessage';
import './callbacks/afterSetReaction';
import './callbacks/afterUnsetReaction';

class Client {
	searchUsers(query) {
		if (!Federation.enabled) {
			throw Federation.errors.disabled('client.searchUsers');
		}

		logger.client.debug(`searchUsers => query=${ query }`);

		const [username, peerDomain] = query.split('@');

		const uri = `/api/v1/federation.users.search?${ qs.stringify({ username, domain: peerDomain }) }`;

		const { data: { users } } = Federation.http.requestToPeer('GET', peerDomain, uri);

		return users;
	}

	getUserByUsername(query) {
		if (!Federation.enabled) {
			throw Federation.errors.disabled('client.searchUsers');
		}

		logger.client.debug(`getUserByUsername => query=${ query }`);

		const [username, peerDomain] = query.split('@');

		const uri = `/api/v1/federation.users.getByUsername?${ qs.stringify({ username }) }`;

		const { data: { user } } = Federation.http.requestToPeer('GET', peerDomain, uri);

		return user;
	}

	dispatchEvent(domains, event) {
		if (!Federation.enabled) {
			throw Federation.errors.disabled('client.dispatchEvent');
		}

		this.dispatchEvents(domains, [event]);
	}

	dispatchEvents(domains, events) {
		if (!Federation.enabled) {
			throw Federation.errors.disabled('client.dispatchEvents');
		}

		logger.client.debug(`dispatchEvents => domains=${ domains.join(', ') } events=${ events.map((e) => JSON.stringify(e, null, 2)) }`);

		const uri = '/api/v1/federation.events.dispatch';

		for (const domain of domains) {
			const { data } = Federation.http.requestToPeer('POST', domain, uri, { events }, { ignoreErrors: true });

			console.log(data);
		}
	}

	requestEventsFromLatest(domain, fromDomain, contextType, contextQuery, latestEventIds) {
		if (!Federation.enabled) {
			throw Federation.errors.disabled('client.requestEventsFromLatest');
		}

		logger.client.debug(`requestEventsFromLatest => domain=${ domain } contextType=${ contextType } contextQuery=${ JSON.stringify(contextQuery, null, 2) } latestEventIds=${ latestEventIds.join(', ') }`);

		const uri = '/api/v1/federation.events.requestFromLatest';

		Federation.http.requestToPeer('POST', domain, uri, { fromDomain, contextType, contextQuery, latestEventIds });
	}
}

export const client = new Client();
