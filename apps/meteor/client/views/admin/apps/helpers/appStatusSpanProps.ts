import { AppStatus } from '@rocket.chat/apps-engine/definition/AppStatus';
import { App } from '@rocket.chat/core-typings';

import { appErroredStatuses } from '../helpers';
import appEnabledStatuses from '../utils/appEnabledStatuses';

type appStatusSpanResponseProps = {
	type?: 'failed' | 'warning';
	icon: 'warning' | 'ban' | 'checkmark-circled' | 'check';
	label: 'Config Needed' | 'Failed' | 'Disabled' | 'Trial period' | 'Installed';
};

export const appStatusSpanProps = ({ installed, status, subscriptionInfo }: App): appStatusSpanResponseProps | undefined => {
	if (!installed) {
		return;
	}

	const isFailed = status && appErroredStatuses.includes(status);
	if (isFailed) {
		return {
			type: 'failed',
			icon: 'warning',
			label: status === AppStatus.INVALID_SETTINGS_DISABLED ? 'Config Needed' : 'Failed',
		};
	}

	const isEnabled = status && appEnabledStatuses.includes(status);
	if (!isEnabled) {
		return {
			type: 'warning',
			icon: 'ban',
			label: 'Disabled',
		};
	}

	const isOnTrialPeriod = subscriptionInfo && subscriptionInfo.status === 'trialing';
	if (isOnTrialPeriod) {
		return {
			icon: 'checkmark-circled',
			label: 'Trial period',
		};
	}

	return {
		icon: 'check',
		label: 'Installed',
	};
};
