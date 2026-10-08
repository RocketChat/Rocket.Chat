import type { ConferenceMember } from '../../context/definitions';
import type { CallState } from '../context';

/** Each raised hand's place in the queue, from 1, by participant id. */
export const handPositionsOf = (raisedHands: CallState['raisedHands']): Record<string, number> =>
	Object.fromEntries(raisedHands.map(({ id }, index) => [id, index + 1]));

/**
 * The queue with a name for each hand, taken from the membership; `fallbackName` where nobody there matches. The
 * reader's own hand is marked, so it can be told apart from someone who happens to share their name.
 */
export const nameRaisedHands = (
	raisedHands: CallState['raisedHands'],
	members: Pick<ConferenceMember, '_id' | 'name' | 'username'>[],
	fallbackName: string,
	selfId: string,
): { id: string; name: string; isLocal?: boolean }[] =>
	raisedHands.map(({ id }) => {
		const member = members.find(({ _id }) => _id === id);
		const name = member?.name || member?.username || fallbackName;
		return id === selfId ? { id, name, isLocal: true } : { id, name };
	});
