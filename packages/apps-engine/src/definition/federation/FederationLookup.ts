/** Where a federated room lives on the Matrix network it came from. */
export type FederationLookup = {
	/** The version of this lookup's own shape. */
	version: number;
	/** The room's Matrix id. */
	mrid: string;
	/** The Matrix server the room belongs to. */
	origin: string;
};
