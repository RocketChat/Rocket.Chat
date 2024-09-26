import { useSetting } from '@rocket.chat/ui-contexts';

export const useAirGappedRestriction = (): [isRestrictionPhase: boolean, isWarningPhase: boolean, remainingDays: number] => {
	const airGappedRestrictionRemainingDays = useSetting('Cloud_Workspace_AirGapped_Restrictions_Remaining_Days');

	if (typeof airGappedRestrictionRemainingDays !== 'number') {
		return [false, false, -1];
	}

	// If this value is negative, the user has a license with valid module
	if (airGappedRestrictionRemainingDays < 0) {
		return [false, false, airGappedRestrictionRemainingDays];
	}

	const isRestrictionPhase = airGappedRestrictionRemainingDays === 0;
	const isWarningPhase = !isRestrictionPhase && airGappedRestrictionRemainingDays <= 7;

	return [isRestrictionPhase, isWarningPhase, airGappedRestrictionRemainingDays];
};
