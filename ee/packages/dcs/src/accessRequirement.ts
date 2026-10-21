import type { ISecurityAccessRequirement, ISecurityClearance, ISecurityLabel, ISecurityReaderAccess } from '@rocket.chat/core-typings';

import { categoryKey } from './policy/types';
import type { SecurityPolicy } from './policy/types';

/**
 * Flattens what {@link canAccess} checks for a label into a shape a database query can evaluate.
 * The label is expected to be valid; a category the policy doesn't define becomes a required key, so it denies
 * every reader who doesn't hold that exact key.
 */
export const accessRequirement = (policy: SecurityPolicy, label: ISecurityLabel): ISecurityAccessRequirement => {
	const required = new Set<string>();
	const permissiveTags = new Map<string, Set<string>>();

	for (const category of label.categories) {
		const key = categoryKey(category);
		const definition = policy.categoriesByKey.get(key);

		switch (definition?.tagType) {
			case 'permissive':
			case 'enumeratedPermissive': {
				const tag = `${definition.tagSetId}|${definition.tagName}`;
				permissiveTags.set(tag, (permissiveTags.get(tag) ?? new Set()).add(key));
				break;
			}
			case 'informative':
				break;
			default:
				required.add(key);
		}
	}

	return {
		policyId: label.policyId,
		classification: label.classification,
		required: [...required].sort(),
		anyOf: [...permissiveTags.values()].map((keys) => ({ keys: [...keys].sort() })),
	};
};

/**
 * Flattens a reader's clearances into the keys an {@link accessRequirement} is checked against.
 */
export const readerAccess = (clearances: ISecurityClearance[] | undefined): ISecurityReaderAccess =>
	(clearances ?? []).map(({ policyId, classifications, categories }) => ({
		policyId,
		classifications,
		keys: categories.map(categoryKey),
	}));

/**
 * Evaluates a requirement the way the database query does.
 */
export const meetsRequirement = (requirement: ISecurityAccessRequirement, access: ISecurityReaderAccess): boolean =>
	access.some(
		({ policyId, classifications, keys }) =>
			policyId === requirement.policyId &&
			classifications.includes(requirement.classification) &&
			requirement.required.every((key) => keys.includes(key)) &&
			requirement.anyOf.every((group) => group.keys.some((key) => keys.includes(key))),
	);
