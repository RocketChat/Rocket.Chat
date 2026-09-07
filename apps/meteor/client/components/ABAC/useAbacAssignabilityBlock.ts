import { useTranslation } from 'react-i18next';

import { useAttributeList } from '../../views/admin/ABAC/hooks/useAttributeList';

export type AbacAssignabilityBlock = {
	/** The creation flow cannot proceed: this user has nothing to assign, or is missing a required attribute. */
	isBlocked: boolean;
	/** Why, ready to render. Undefined while the list is still loading, or when nothing blocks. */
	reason?: string;
	isLoading: boolean;
};

/**
 * Whether this user can assign attributes at all, and if not, why (ABAC-P4 QA).
 *
 * Under ABAC-P4/D12 the picker offers only what the user could be granted, so a user who carries no
 * attributes is offered nothing — and a workspace-required attribute they do not carry can never be
 * satisfied. Both leave them unable to finish the flow. Saying so beats a search box with no
 * options behind it.
 *
 * Reported rather than enforced: the server refuses the creation either way, through
 * `assertCanAssignAttributes` and the enforcement guard on `beforeCreateRoom`. This is the flow
 * telling the user before they get there.
 */
export const useAbacAssignabilityBlock = (requiredAttributeKeys: string[]): AbacAssignabilityBlock => {
	const { t } = useTranslation();
	const { data, isLoading } = useAttributeList({ assignableOnly: true });

	if (isLoading || !data) {
		return { isBlocked: false, isLoading: true };
	}

	const assignableKeys = new Set(data.attributes.map(({ value }) => value));

	if (assignableKeys.size === 0) {
		return { isBlocked: true, reason: t('ABAC_No_attributes_to_assign'), isLoading: false };
	}

	const missingRequired = requiredAttributeKeys.filter((key) => !assignableKeys.has(key));

	if (missingRequired.length) {
		return { isBlocked: true, reason: t('ABAC_Missing_required_attributes', { keys: missingRequired.join(', ') }), isLoading: false };
	}

	return { isBlocked: false, isLoading: false };
};
