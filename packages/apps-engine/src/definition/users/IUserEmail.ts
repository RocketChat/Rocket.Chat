/** One of a user's email addresses. */
export interface IUserEmail {
	/** The address itself. */
	address: string;
	/** Whether the user has proved they own the address. */
	verified: boolean;
}
