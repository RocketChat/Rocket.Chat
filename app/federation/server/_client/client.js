import qs from 'querystring';

import { logger } from '../logger';
import { Federation } from '../federation';
// Callbacks
import { definition as afterAddedToRoomDef } from './callbacks/afterAddedToRoom';
import { definition as afterCreateDirectRoomDef } from './callbacks/afterCreateDirectRoom';
import { definition as afterCreateRoomDef } from './callbacks/afterCreateRoom';
import { definition as afterDeleteMessageDef } from './callbacks/afterDeleteMessage';
import { definition as afterMuteUserDef } from './callbacks/afterMuteUser';
import { definition as afterRemoveFromRoomDef } from './callbacks/afterRemoveFromRoom';
import { definition as afterSaveMessageDef } from './callbacks/afterSaveMessage';
import { definition as afterSetReactionDef } from './callbacks/afterSetReaction';
import { definition as afterUnmuteUserDef } from './callbacks/afterUnmuteUser';
import { definition as afterUnsetReactionDef } from './callbacks/afterUnsetReaction';
import { definition as beforeDeleteRoomDef } from './callbacks/beforeDeleteRoom';
import { callbacks } from '../../../callbacks';

class Client {
	callbackDefinitions = [];

	register(callbackDefition) {
		this.callbackDefinitions.push(callbackDefition);
	}

	enableCallbacks() {
		for (const definition of this.callbackDefinitions) {
			console.log('enableCallback ->', definition.hook, definition.id);
			callbacks.add(definition.hook, definition.callback, callbacks.priority.LOW, definition.id);
		}
	}

	disableCallbacks() {
		for (const definition of this.callbackDefinitions) {
			console.log('disableCallback ->', definition.hook, definition.id);
			callbacks.remove(definition.hook, definition.id);
		}
	}

	searchUsers(query) {
		console.log('searchUsers ->', query);
		if (!Federation.enabled) {
			throw Federation.errors.disabled('client.searchUsers');
		}

		logger.client.debug(() => `searchUsers => query=${ query }`);

		const [username, peerDomain] = query.split('@');

		const uri = `/api/v1/federation.users.search?${ qs.stringify({ username, domain: peerDomain }) }`;

		const { data: { users } } = Federation.http.requestToPeer('GET', peerDomain, uri);

		return users;
	}

	getUserByUsername(query) {
		console.log('getUserByUsername ->', query);
		if (!Federation.enabled) {
			throw Federation.errors.disabled('client.searchUsers');
		}

		logger.client.debug(() => `getUserByUsername => query=${ query }`);

		const [username, peerDomain] = query.split('@');

		const uri = `/api/v1/federation.users.getByUsername?${ qs.stringify({ username }) }`;

		const { data: { user } } = Federation.http.requestToPeer('GET', peerDomain, uri);

		return user;
	}

	dispatchEvent(domains, event) {
		console.log('dispatchEvent ->', domains, event);
		if (!Federation.enabled) {
			throw Federation.errors.disabled('client.dispatchEvent');
		}

		this.dispatchEvents(domains, [event]);
	}

	dispatchEvents(domains, events) {
		console.log('dispatchEvents ->', domains, event);
		if (!Federation.enabled) {
			throw Federation.errors.disabled('client.dispatchEvents');
		}

		logger.client.debug(() => `dispatchEvents => domains=${ domains.join(', ') } events=${ events.map((e) => JSON.stringify(e, null, 2)) }`);

		const uri = '/api/v1/federation.events.dispatch';

		for (const domain of domains) {
			Federation.http.requestToPeer('POST', domain, uri, { events }, { ignoreErrors: true });
		}
	}

	requestEventsFromLatest(domain, fromDomain, contextType, contextQuery, latestEventIds) {
		console.log('requestEventsFromLatest ->', domain, fromDomain);
		if (!Federation.enabled) {
			throw Federation.errors.disabled('client.requestEventsFromLatest');
		}

		logger.client.debug(() => `requestEventsFromLatest => domain=${ domain } contextType=${ contextType } contextQuery=${ JSON.stringify(contextQuery, null, 2) } latestEventIds=${ latestEventIds.join(', ') }`);

		const uri = '/api/v1/federation.events.requestFromLatest';

		Federation.http.requestToPeer('POST', domain, uri, { fromDomain, contextType, contextQuery, latestEventIds });
	}

	getUpload(domain, fileId) {
		console.log('getUpload ->', domain);
		const { data: { upload, buffer } } = Federation.http.requestToPeer('GET', domain, `/api/v1/federation.uploads?${ qs.stringify({ upload_id: fileId }) }`);

		return { upload, buffer: Buffer.from(buffer) };
	}
}

export const client = new Client();

client.register(afterAddedToRoomDef);
client.register(afterCreateDirectRoomDef);
client.register(afterCreateRoomDef);
client.register(afterDeleteMessageDef);
client.register(afterMuteUserDef);
client.register(beforeDeleteRoomDef);
client.register(afterSaveMessageDef);
client.register(afterSetReactionDef);
client.register(afterUnmuteUserDef);
client.register(afterUnsetReactionDef);
client.register(afterRemoveFromRoomDef);
