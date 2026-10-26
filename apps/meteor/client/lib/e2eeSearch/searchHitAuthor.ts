import type { IMessage } from '@rocket.chat/core-typings';
import type { E2EESearchHit } from '@rocket.chat/desktop-api';

export type SearchHitAuthor = { username: string; name?: string };

const isNonEmptyString = (value: unknown): value is string => typeof value === 'string' && value.length > 0;

/**
 * Returns the author to show for a local search hit, with no server request: the author of the message when the client
 * already has it (it carries the real name), else the author that the local index stores with the hit. A hit from a
 * desktop app that sends no author, for a message that the client does not have, has no author.
 */
export const getSearchHitAuthor = (hit: E2EESearchHit, loadedMessage?: Pick<IMessage, 'u'>): SearchHitAuthor | undefined => {
	const { username: loadedUsername, name } = loadedMessage?.u ?? {};
	if (isNonEmptyString(loadedUsername)) {
		return { username: loadedUsername, ...(isNonEmptyString(name) && { name }) };
	}

	if (isNonEmptyString(hit.username)) {
		return { username: hit.username };
	}

	return undefined;
};
