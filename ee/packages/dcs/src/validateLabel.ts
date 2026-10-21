import type { ISecurityLabel, SecurityCategory } from '@rocket.chat/core-typings';

import { categoryKey } from './policy/types';
import type { CategoryRequirement, SecurityPolicy } from './policy/types';

export type LabelViolation =
	| { code: 'policy-mismatch' }
	| { code: 'unknown-classification' }
	| { code: 'obsolete-classification' }
	| { code: 'unknown-category'; category: SecurityCategory }
	| { code: 'obsolete-category'; category: SecurityCategory }
	| { code: 'duplicate-category'; category: SecurityCategory }
	| { code: 'single-selection'; tagSetId: string; tagName: string }
	| { code: 'excluded-classification'; category: SecurityCategory }
	| { code: 'excluded-category'; category: SecurityCategory; excluded: SecurityCategory }
	| { code: 'required-category'; requiredBy: 'classification' | SecurityCategory; requirement: CategoryRequirement };

const satisfies = ({ operation, categoryGroups }: CategoryRequirement, present: Set<string>): boolean => {
	const matches = categoryGroups.filter((group) => group.some((category) => present.has(categoryKey(category)))).length;
	switch (operation) {
		case 'all':
			return matches === categoryGroups.length;
		case 'oneOrMore':
			return matches >= 1;
		case 'onlyOne':
			return matches === 1;
	}
};

/**
 * Lists every rule of the policy that a newly applied label breaks; an empty list means the label is valid.
 * Obsolete values are rejected here, since they may still be read but no longer applied.
 */
export const validateLabel = (policy: SecurityPolicy, label: ISecurityLabel): LabelViolation[] => {
	if (label.policyId !== policy.id) {
		return [{ code: 'policy-mismatch' }];
	}

	const violations: LabelViolation[] = [];
	const classification = policy.classificationsByLacv.get(label.classification);
	if (!classification) {
		violations.push({ code: 'unknown-classification' });
	} else if (classification.obsolete) {
		violations.push({ code: 'obsolete-classification' });
	}

	const present = new Set<string>();
	const perTag = new Map<string, number>();

	for (const category of label.categories) {
		const key = categoryKey(category);
		const definition = policy.categoriesByKey.get(key);
		if (!definition) {
			violations.push({ code: 'unknown-category', category });
			continue;
		}
		if (present.has(key)) {
			violations.push({ code: 'duplicate-category', category });
			continue;
		}
		present.add(key);
		if (definition.obsolete) {
			violations.push({ code: 'obsolete-category', category });
		}
		const tag = `${definition.tagSetId}|${definition.tagName}`;
		perTag.set(tag, (perTag.get(tag) ?? 0) + 1);
	}

	for (const tagSet of policy.tagSets) {
		for (const tag of tagSet.tags) {
			if (tag.singleSelection && (perTag.get(`${tagSet.id}|${tag.name}`) ?? 0) > 1) {
				violations.push({ code: 'single-selection', tagSetId: tagSet.id, tagName: tag.name });
			}
		}
	}

	for (const key of present) {
		const definition = policy.categoriesByKey.get(key);
		if (!definition) continue;
		const category = { tagSetId: definition.tagSetId, tagType: definition.tagType, lacv: definition.lacv };

		if (definition.excludedClassifications.includes(label.classification)) {
			violations.push({ code: 'excluded-classification', category });
		}
		for (const excluded of definition.excludedCategories) {
			if (present.has(categoryKey(excluded))) {
				violations.push({ code: 'excluded-category', category, excluded });
			}
		}
		for (const requirement of definition.requiredCategories) {
			if (!satisfies(requirement, present)) {
				violations.push({ code: 'required-category', requiredBy: category, requirement });
			}
		}
	}

	for (const requirement of classification?.requiredCategories ?? []) {
		if (!satisfies(requirement, present)) {
			violations.push({ code: 'required-category', requiredBy: 'classification', requirement });
		}
	}

	return violations;
};
