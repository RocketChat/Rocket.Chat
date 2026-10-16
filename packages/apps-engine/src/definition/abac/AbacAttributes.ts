/**
 * One attribute of an attribute-based access control policy: a key and the
 * values a subject may hold for it.
 */
export interface IAbacAttributeDefinition {
	/**
	 * Validation expectation (NOT enforced here, must be enforced by caller):
	 *   /^[A-Za-z0-9_-]+$/
	 */
	key: string;

	/**
	 * List of string values for this attribute key.
	 */
	values: string[];
}
