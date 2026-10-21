import type { ISecurityClearance, ISecurityLabel, SecurityLabelCatalogItem } from '@rocket.chat/core-typings';

import { canAccess } from './accessControl';
import { displayMarking } from './marking/displayMarking';
import type { DisplayMarkingOptions } from './marking/displayMarking';
import { categoryKey } from './policy/types';
import type { SecurityPolicy } from './policy/types';
import { validateLabel } from './validateLabel';

export type CatalogEntry = {
	label: ISecurityLabel;
	/** Defaults to the label's marking */
	selector?: string;
};

const sameLabel = (a: ISecurityLabel, b: ISecurityLabel): boolean => {
	if (a.policyId !== b.policyId || a.classification !== b.classification || a.categories.length !== b.categories.length) {
		return false;
	}
	const keys = new Set(a.categories.map(categoryKey));
	return b.categories.every((category) => keys.has(categoryKey(category)));
};

/**
 * One uncategorized label per classification still in use, in hierarchy order: the catalog a policy offers
 * when no administrator has configured one.
 */
export const defaultCatalogEntries = (policy: SecurityPolicy): CatalogEntry[] =>
	policy.classifications
		.filter(({ obsolete }) => !obsolete)
		.sort((a, b) => a.hierarchy - b.hierarchy)
		.map(({ lacv }) => ({ label: { policyId: policy.id, classification: lacv, categories: [] } }));

/**
 * Narrows a configured catalog to the labels that are valid under the policy and that every given clearance
 * covers, typically the sender's and the room's, so any item picked can actually be sent.
 */
export const buildCatalog = (
	policy: SecurityPolicy,
	entries: CatalogEntry[],
	clearances: ISecurityClearance[],
	{ defaultLabel, ...markingOptions }: DisplayMarkingOptions & { defaultLabel?: ISecurityLabel } = {},
): SecurityLabelCatalogItem[] =>
	entries
		.filter(({ label }) => validateLabel(policy, label).length === 0)
		.filter(({ label }) => clearances.every((clearance) => canAccess(policy, label, clearance)))
		.map(({ label, selector }) => {
			const marking = displayMarking(policy, label, markingOptions);
			return {
				selector: selector ?? marking.text,
				default: Boolean(defaultLabel && sameLabel(label, defaultLabel)),
				label,
				marking,
			};
		});
