/**
 * The kind of a SPIF `securityCategoryTag`: enumerated tags keep their `enumType`, and `tagType7` tags are informative.
 * STANAG 4774 collapses these to its `Category@Type` values PERMISSIVE, RESTRICTIVE and INFORMATIVE.
 */
export type SecurityCategoryTagType = 'restrictive' | 'permissive' | 'enumeratedRestrictive' | 'enumeratedPermissive' | 'informative';

/**
 * One category value, identified the way an ESS security label identifies it.
 */
export type SecurityCategory = {
	/** OID of the SPIF `securityCategoryTagSet` */
	tagSetId: string;
	tagType: SecurityCategoryTagType;
	/** The `lacv` of the SPIF `tagCategory`, as written in the SPIF */
	lacv: string;
};

/**
 * A confidentiality label bound to a piece of data (STANAG 4774 `ConfidentialityInformation`).
 * Names and markings are not stored: they are derived from the policy, so a SPIF update re-renders every label.
 */
export type ISecurityLabel = {
	/** OID of the SPIF `securityPolicyId` */
	policyId: string;
	/** The `lacv` of the SPIF `securityClassification` */
	classification: number;
	categories: SecurityCategory[];
	creationDateTime?: Date;
	reviewDateTime?: Date;
};

/**
 * What a user may read, or what a room may carry, under one policy.
 */
export type ISecurityClearance = {
	policyId: string;
	/** `lacv`s of the classifications covered */
	classifications: number[];
	categories: SecurityCategory[];
};

/**
 * The user-facing rendition of a label (XEP-0258 `displaymarking`).
 */
export type SecurityLabelDisplayMarking = {
	text: string;
	fgcolor: string;
	bgcolor: string;
};

/**
 * One label a sender may pick (XEP-0258 catalog `item`).
 */
export type SecurityLabelCatalogItem = {
	/** Human-readable path that identifies the item in the catalog */
	selector: string;
	default: boolean;
	label: ISecurityLabel;
	marking: SecurityLabelDisplayMarking;
};
