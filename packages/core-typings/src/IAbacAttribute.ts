import type { IRocketChatRecord } from './IRocketChatRecord';

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

export interface IAbacAttribute extends IRocketChatRecord, IAbacAttributeDefinition {}
