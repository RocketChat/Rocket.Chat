import type { ISecurityClearance, ISecurityLabel } from '@rocket.chat/core-typings';

import { categoryKey } from './policy/types';
import type { SecurityPolicy } from './policy/types';

/**
 * Decides whether a clearance covers a label (the CMBAC access control decision function):
 * the classification must be in the clearance, every restrictive category must be held, and
 * for each permissive tag the label uses, at least one of its values must be held.
 * Anything the policy does not define denies access.
 */
export const canAccess = (policy: SecurityPolicy, label: ISecurityLabel, clearance: ISecurityClearance): boolean => {
	if (label.policyId !== policy.id || clearance.policyId !== policy.id) {
		return false;
	}

	if (!policy.classificationsByLacv.has(label.classification) || !clearance.classifications.includes(label.classification)) {
		return false;
	}

	const held = new Set(clearance.categories.map(categoryKey));
	const permissiveTags = new Map<string, boolean>();

	for (const category of label.categories) {
		const key = categoryKey(category);
		const definition = policy.categoriesByKey.get(key);
		if (!definition) {
			return false;
		}

		switch (definition.tagType) {
			case 'restrictive':
			case 'enumeratedRestrictive':
				if (!held.has(key)) {
					return false;
				}
				break;
			case 'permissive':
			case 'enumeratedPermissive': {
				const tag = `${definition.tagSetId}|${definition.tagName}`;
				permissiveTags.set(tag, (permissiveTags.get(tag) ?? false) || held.has(key));
				break;
			}
			case 'informative':
				break;
		}
	}

	return [...permissiveTags.values()].every(Boolean);
};

/**
 * Picks, from a user's clearances, the one that applies to a label's policy.
 */
export const clearanceForPolicy = (clearances: ISecurityClearance[] | undefined, policyId: string): ISecurityClearance | undefined =>
	clearances?.find((clearance) => clearance.policyId === policyId);
