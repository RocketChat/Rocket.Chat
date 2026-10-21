import type { ISecurityLabel } from '@rocket.chat/core-typings';

import { categoryKey } from './policy/types';
import type { SecurityPolicy } from './policy/types';

type Constraints = { restrictive: Set<string>; permissive: Map<string, Set<string>> };

// A category the policy doesn't define counts as restrictive, like accessRequirement does.
const constraintsOf = (policy: SecurityPolicy, label: ISecurityLabel): Constraints => {
	const constraints: Constraints = { restrictive: new Set(), permissive: new Map() };
	for (const category of label.categories) {
		const key = categoryKey(category);
		const definition = policy.categoriesByKey.get(key);
		switch (definition?.tagType) {
			case 'permissive':
			case 'enumeratedPermissive': {
				const tag = `${definition.tagSetId}|${definition.tagName}`;
				constraints.permissive.set(tag, (constraints.permissive.get(tag) ?? new Set()).add(key));
				break;
			}
			case 'informative':
				break;
			default:
				constraints.restrictive.add(key);
		}
	}
	return constraints;
};

/**
 * Whether content labeled `lower` may be carried under `higher` without being downgraded: same policy,
 * a classification at least as high in the SPIF hierarchy, every restrictive category of `lower`, and, for each
 * permissive tag `lower` uses, the same tag releasable to no one `lower` isn't releasable to.
 */
export const dominates = (policy: SecurityPolicy, higher: ISecurityLabel, lower: ISecurityLabel): boolean => {
	if (higher.policyId !== policy.id || lower.policyId !== policy.id) {
		return false;
	}

	const higherClassification = policy.classificationsByLacv.get(higher.classification);
	const lowerClassification = policy.classificationsByLacv.get(lower.classification);
	if (!higherClassification || !lowerClassification || higherClassification.hierarchy < lowerClassification.hierarchy) {
		return false;
	}

	const high = constraintsOf(policy, higher);
	const low = constraintsOf(policy, lower);

	for (const key of low.restrictive) {
		if (!high.restrictive.has(key)) {
			return false;
		}
	}

	for (const [tag, lowValues] of low.permissive) {
		const highValues = high.permissive.get(tag);
		if (!highValues || [...highValues].some((key) => !lowValues.has(key))) {
			return false;
		}
	}

	return true;
};
