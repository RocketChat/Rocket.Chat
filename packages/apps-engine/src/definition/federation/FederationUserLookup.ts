/** Where a federated user lives on the Matrix network they came from. */
export type FederationUserLookup = {
	/** The version of this lookup's own shape. */
	version: number;
	/** The user's Matrix id, as `@alice:example.com`. */
	mui: string;
	/** The Matrix server the user belongs to. */
	origin: string;
};
