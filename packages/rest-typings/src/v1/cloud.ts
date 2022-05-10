import type { CloudRegistrationIntentData, CloudConfirmationPollData, CloudRegistrationStatus } from '@rocket.chat/core-typings';

export type CloudEndpoints = {
	'/v1/cloud.manualRegister': {
		POST: (params: { cloudBlob: string }) => void;
	};
	'/v1/cloud.createRegistrationIntent': {
		POST: (params: { resend: boolean; email: string }) => {
			intentData: CloudRegistrationIntentData;
		};
	};
	'/v1/cloud.confirmationPoll': {
		GET: (params: { deviceCode: string; resend?: boolean }) => {
			pollData: CloudConfirmationPollData;
		};
	};
	'/v1/cloud.registrationStatus': {
		GET: (params: void) => { registrationStatus: CloudRegistrationStatus };
	};
};
