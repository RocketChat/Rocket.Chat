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

	//
	// Side B
	//
	// Federation ➔ http.debug [POST] http://local.rocket.chat:2999/api/v1/federation.events.requestFromLatest
	// 		server.js:207 Federation ➔ http.error Error Error: socket hang up
	// === UnHandledPromiseRejection ===
	// { Error: socket hang up
	// 	at createHangUpError (_http_client.js:331:15)
	// 	at Socket.socketOnEnd (_http_client.js:423:23)
	// 	at emitNone (events.js:111:20)
	// 	at Socket.emit (events.js:208:7)
	// 	at endReadableNT (_stream_readable.js:1064:12)
	// 	at _combinedTickCallback (internal/process/next_tick.js:138:11)
	// 	at process._tickDomainCallback (internal/process/next_tick.js:218:9) code: 'ECONNRESET' }
	// ---------------------------------
	// 	Errors like this can cause oplog processing errors.
	// 	Setting EXIT_UNHANDLEDPROMISEREJECTION will cause the process to exit allowing your service to automatically restart the process
	// Future node.js versions will automatically exit the process

	//
	// Side A
	//
	// W20190815-14:22:25.089(-3)? (STDERR) === UnHandledPromiseRejection ===
	// W20190815-14:22:25.090(-3)? (STDERR) TypeError: Cannot read property 'timestamp' of undefined
	// W20190815-14:22:25.090(-3)? (STDERR)     at Promise.asyncApply (app/federation/server/_server/endpoints/events/requestFromLatest.js:31:129)
	// W20190815-14:22:25.091(-3)? (STDERR)     at /Users/allskar/.meteor/packages/promise/.0.11.2.1ixw4hn.8uhlk++os+web.browser+web.browser.legacy+web.cordova/npm/node_modules/meteor-promise/fiber_pool.js:43:40
	// W20190815-14:22:25.092(-3)? (STDERR) ---------------------------------
	// W20190815-14:22:25.092(-3)? (STDERR) Errors like this can cause oplog processing errors.
	// W20190815-14:22:25.092(-3)? (STDERR) Setting EXIT_UNHANDLEDPROMISEREJECTION will cause the process to exit allowing your service to automatically restart the process
	// W20190815-14:22:25.092(-3)? (STDERR) Future node.js versions will automatically exit the process
	// W20190815-14:22:25.092(-3)? (STDERR) =================================

	requestEventsFromLatest(domain, fromDomain, contextType, contextQuery, latestEventIds) {
		if (!Federation.enabled) {
			throw Federation.errors.disabled('client.requestEventsFromLatest');
		}

		logger.client.debug(`requestEventsFromLatest => domain=${ domain } contextType=${ contextType } contextQuery=${ JSON.stringify(contextQuery, null, 2) } latestEventIds=${ latestEventIds.join(', ') }`);

		const uri = '/api/v1/federation.events.requestFromLatest';

		Federation.http.requestToPeer('POST', domain, uri, { fromDomain, contextType, contextQuery, latestEventIds });
	}

	// requestEventsFromMissingParent(domain, fromDomain, contextType, contextQuery, missingParentIds, latestContextIds) {
	// 	if (!Federation.enabled) {
	// 		throw Federation.errors.disabled('client.requestEvents');
	// 	}
	//
	// 	logger.client.debug(`requestEvents => domain=${ domain } contextType=${ contextType } contextQuery=${ JSON.stringify(contextQuery, null, 2) } missingParentIds=${ missingParentIds.join(', ') }`);
	//
	// 	const uri = '/api/v1/federation.events.requestFromMissingParent';
	//
	// 	Federation.http.requestToPeer('POST', domain, uri, { fromDomain, contextType, contextQuery, missingParentIds });
	// }
}

export const client = new Client();
