import type { BehaviorWithContext, LicenseBehavior } from '@rocket.chat/core-typings';
import type { TranslationKey } from '@rocket.chat/ui-contexts';

export const getLicenseInvalidMessage = (reasons: BehaviorWithContext[]): TranslationKey => {
	const hasErrorReason = (behavior: LicenseBehavior, reason: string) => reasons.some((r) => r.behavior === behavior && r.reason === reason);

	if (hasErrorReason('invalidate_license', 'url')) {
		return 'License_error_url_mismatch';
	}

	if (hasErrorReason('invalidate_license', 'period')) {
		return 'License_error_expired';
	}

	if (hasErrorReason('prevent_installation', 'period')) {
		return 'License_error_outside_date_range';
	}

	if (hasErrorReason('invalidate_license', 'limit') || hasErrorReason('prevent_installation', 'limit')) {
		return 'License_error_limits_exceeded';
	}

	return 'License_error_generic';
};
