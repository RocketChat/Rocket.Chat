/**
 * Enough of a user to name them, embedded in another record rather than read on
 * its own.
 *
 * It is a copy taken when the record was written, so read the user through
 * `IUserRead` when the current values matter.
 */
export interface IUserLookup {
	/** The user's identifier. */
	_id: string;
	/** The user's username. */
	username: string;
	/** The user's display name. */
	name?: string;
}
