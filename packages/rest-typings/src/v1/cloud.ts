import type { CloudRegistrationIntentData, CloudConfirmationPollData, CloudRegistrationStatus } from '@rocket.chat/core-typings';

export type CloudEndpoints = {
	'cloud.manualRegister': {
		POST: (params: { cloudBlob: string }) => void;
	};
	'cloud.createRegistrationIntent': {
		POST: (params: { resend: boolean; email: string }) => {
			intentData: CloudRegistrationIntentData;
		};
	};
	'cloud.confirmationPoll': {
		GET: (params: { deviceCode: string; resend?: boolean }) => {
			pollData: CloudConfirmationPollData;
		};
	};
	'cloud.registrationStatus': {
		GET: (params: void) => { registrationStatus: CloudRegistrationStatus };
	};
};
