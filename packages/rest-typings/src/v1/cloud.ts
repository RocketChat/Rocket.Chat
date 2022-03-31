import type { CloudRegistrationIntentData, CloudConfirmationPollData } from '@rocket.chat/core-typings';

export type CloudEndpoints = {
	'cloud.manualRegister': {
		POST: (params: { cloudBlob: string }) => void;
	};
	'cloud.createRegistrationIntent': {
		POST: (params: { resend: boolean; email: string }) => { intentData: CloudRegistrationIntentData };
	};
	'cloud.confirmationPoll': {
		GET: (params: { deviceCode: string; resend?: boolean }) => { pollData: CloudConfirmationPollData };
	};
};
