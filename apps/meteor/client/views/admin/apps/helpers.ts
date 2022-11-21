import { AppStatus } from '@rocket.chat/apps-engine/definition/AppStatus';

type PlanType = 'Subscription' | 'Paid' | 'Free';

export type FormattedPriceAndPlan = {
	type: PlanType;
	price: string;
};

export const appErroredStatuses = [
	AppStatus.COMPILER_ERROR_DISABLED,
	AppStatus.ERROR_DISABLED,
	AppStatus.INVALID_SETTINGS_DISABLED,
	AppStatus.INVALID_LICENSE_DISABLED,
];
