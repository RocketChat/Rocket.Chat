import type { ConferenceMember } from '../../context/definitions';
import type { CallState } from '../context';

/** Each raised hand's place in the queue, from 1, by participant id. */
export const handPositionsOf = (raisedHands: CallState['raisedHands']): Record<string, number> =>
	Object.fromEntries(raisedHands.map(({ id }, index) => [id, index + 1]));

/** The queue with a name for each hand, taken from the membership; `fallbackName` where nobody there matches. */
export const nameRaisedHands = (
	raisedHands: CallState['raisedHands'],
	members: Pick<ConferenceMember, '_id' | 'name' | 'username'>[],
	fallbackName: string,
): { id: string; name: string }[] =>
	raisedHands.map(({ id }) => {
		const member = members.find(({ _id }) => _id === id);
		return { id, name: member?.name || member?.username || fallbackName };
	});
