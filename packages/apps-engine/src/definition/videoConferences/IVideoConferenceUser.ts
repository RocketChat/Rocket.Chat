/** Enough of a user to show who is in a conference. */
export interface IVideoConferenceUser {
	/** The user's identifier. */
	_id: string;
	/** The user's username. */
	username: string;
	/** The user's display name. */
	name: string;
}
