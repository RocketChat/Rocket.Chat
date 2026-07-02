import type { CloudRegistrationIntentData, CloudConfirmationPollData } from '@rocket.chat/core-typings';

type CloudManualRegister = {
	cloudBlob: string;
};


type CloudCreateRegistrationIntent = {
	resend: boolean;
	email: string;
};


type CloudConfirmationPoll = {
	deviceCode: string;
	resend?: string;
};


// These endpoints are still used by ui-client, so they remain here for now.
// Remove them from the typings once ui-client no longer depends on them.
export type CloudEndpoints = {
	'/v1/cloud.manualRegister': {
		POST: (params: CloudManualRegister) => void;
	};
	'/v1/cloud.createRegistrationIntent': {
		POST: (params: CloudCreateRegistrationIntent) => {
			intentData: CloudRegistrationIntentData;
		};
	};
	'/v1/cloud.registerPreIntent': {
		POST: () => {
			offline: boolean;
		};
	};
	'/v1/cloud.confirmationPoll': {
		GET: (params: CloudConfirmationPoll) => {
			pollData: CloudConfirmationPollData;
		};
	};
};
