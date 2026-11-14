import { createContext } from 'react';

// Each id a rich text refers to is a request to the server, and a surface can hold any number of rich texts.
// Rooms are fewer because rooms.info is the endpoint with the tightest rate limit.
const maxResolved = { users: 20, rooms: 5, teams: 20 } as const;

export type MentionKind = 'users' | 'rooms' | 'teams';

export type MentionBudget = {
	/** The ids that may be looked up: the ones already allowed, then new ones while the kind has room. */
	claim: (kind: MentionKind, ids: readonly string[]) => string[];
};

export const createMentionBudget = (): MentionBudget => {
	const allowed: Record<MentionKind, Set<string>> = { users: new Set(), rooms: new Set(), teams: new Set() };

	return {
		claim: (kind, ids) =>
			ids.filter((id) => {
				if (allowed[kind].has(id)) {
					return true;
				}

				if (allowed[kind].size >= maxResolved[kind]) {
					return false;
				}

				allowed[kind].add(id);
				return true;
			}),
	};
};

/** Shared by every rich text of a surface; without one, each rich text gets a budget of its own. */
export const MentionBudgetContext = createContext<MentionBudget | undefined>(undefined);
